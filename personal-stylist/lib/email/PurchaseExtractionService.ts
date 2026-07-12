import { generateStructured } from "@/lib/ai/client";
import { emailExtractionPrompt } from "@/lib/ai/prompts";
import { EmailPurchaseSchema } from "@/lib/ai/schemas";
import { prisma } from "@/lib/db";

import { GmailClient } from "./GmailClient";

const EXTRACTION_SYSTEM =
  "You are a precise data-extraction assistant. Extract only clothing/apparel purchases " +
  "from order-confirmation emails. Never invent items or prices that are not in the email.";

// Targets likely order-confirmation emails without being so broad we scan the
// whole inbox.
const ORDER_QUERY =
  '(subject:(order OR "order confirmation" OR receipt OR "your order" OR "order shipped" OR purchase)) -in:spam';

function formatGmailDate(date: Date): string {
  // Gmail's after: filter wants YYYY/MM/DD
  return `${date.getUTCFullYear()}/${date.getUTCMonth() + 1}/${date.getUTCDate()}`;
}

function parseDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export type ScanResult = { processed: number; imported: number };

export async function scanInbox(
  userId: string,
  opts?: { maxMessages?: number }
): Promise<ScanResult> {
  const maxMessages = opts?.maxMessages ?? 25;
  const client = new GmailClient(userId);

  const scan = await prisma.emailScan.upsert({
    where: { userId },
    create: { userId, status: "running" },
    update: { status: "running", error: null },
  });

  try {
    const sinceClause = scan.lastScannedAt
      ? ` after:${formatGmailDate(scan.lastScannedAt)}`
      : " newer_than:1y";
    const ids = await client.listMessageIds(ORDER_QUERY + sinceClause, maxMessages);

    let processed = 0;
    let imported = 0;

    for (const id of ids) {
      const msg = await client.getMessage(id);
      processed++;

      const parsed = await generateStructured({
        schema: EmailPurchaseSchema,
        toolName: "extract_purchase",
        toolDescription: "Extract clothing purchases from the email.",
        system: EXTRACTION_SYSTEM,
        prompt: emailExtractionPrompt({
          subject: msg.subject,
          from: msg.from,
          snippet: msg.snippet,
          body: msg.body,
        }),
        maxTokens: 2048,
      });

      if (!parsed.isOrder || parsed.items.length === 0) continue;

      const purchasedAt = parseDate(parsed.purchasedAt) ?? parseDate(msg.date);

      for (const item of parsed.items) {
        await prisma.purchase.upsert({
          where: {
            userId_sourceMessageId_itemName: {
              userId,
              sourceMessageId: id,
              itemName: item.itemName,
            },
          },
          create: {
            userId,
            source: "gmail",
            retailer: parsed.retailer,
            itemName: item.itemName,
            category: item.category,
            price: item.price,
            currency: item.currency,
            purchasedAt,
            sourceMessageId: id,
            attributes: item.attributes ?? undefined,
          },
          update: {
            retailer: parsed.retailer,
            category: item.category,
            price: item.price,
            currency: item.currency,
            purchasedAt,
            attributes: item.attributes ?? undefined,
          },
        });
        imported++;
      }
    }

    await prisma.emailScan.update({
      where: { userId },
      data: {
        status: "idle",
        lastScannedAt: new Date(),
        messagesProcessed: { increment: processed },
        error: null,
      },
    });

    return { processed, imported };
  } catch (error) {
    await prisma.emailScan.update({
      where: { userId },
      data: { status: "error", error: error instanceof Error ? error.message : String(error) },
    });
    throw error;
  }
}
