"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { scanInbox } from "@/lib/email/PurchaseExtractionService";
import { GmailAuthError } from "@/lib/email/GmailClient";
import { isAiConfigured } from "@/lib/ai/client";
import { prisma } from "@/lib/db";
import { generateFeed, ProfileRequiredError } from "@/lib/stylist/RecommendationService";
import { generateScenario } from "@/lib/stylist/ScenarioService";
import { ProfileInputSchema, type ProfileInput } from "@/lib/stylist/types";

type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : { data: T }))
  | { ok: false; error: string };

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

function toDbData(data: ProfileInput) {
  return {
    sizes: data.sizes,
    fitPreferences: data.fitPreferences,
    favoriteColors: data.favoriteColors,
    styleTags: data.styleTags,
    dislikes: data.dislikes,
    budget: data.budget,
    currency: data.currency,
    notes: data.notes,
  };
}

export async function saveProfile(input: ProfileInput): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = ProfileInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid profile data" };

  const data = toDbData(parsed.data);
  await prisma.styleProfile.upsert({
    where: { userId },
    create: { userId, ...data, onboardedAt: new Date() },
    update: data,
  });

  revalidatePath("/settings");
  revalidatePath("/feed");
  return { ok: true };
}

export async function requestFeed(opts?: {
  count?: number;
  categoryFocus?: string;
  maxPrice?: number;
}): Promise<ActionResult<{ id: string }>> {
  if (!isAiConfigured()) return { ok: false, error: "AI is not configured (missing ANTHROPIC_API_KEY)" };
  const userId = await requireUserId();
  try {
    const rec = await generateFeed(userId, opts);
    revalidatePath("/feed");
    return { ok: true, data: { id: rec.id } };
  } catch (error) {
    if (error instanceof ProfileRequiredError) {
      return { ok: false, error: "Complete your style profile first." };
    }
    return { ok: false, error: error instanceof Error ? error.message : "Failed to generate" };
  }
}

export async function requestScenario(prompt: string): Promise<ActionResult<{ id: string }>> {
  if (!isAiConfigured()) return { ok: false, error: "AI is not configured (missing ANTHROPIC_API_KEY)" };
  const trimmed = prompt.trim();
  if (trimmed.length < 3) return { ok: false, error: "Describe the occasion in a bit more detail." };
  const userId = await requireUserId();
  try {
    const rec = await generateScenario(userId, trimmed);
    revalidatePath("/scenario");
    return { ok: true, data: { id: rec.id } };
  } catch (error) {
    if (error instanceof ProfileRequiredError) {
      return { ok: false, error: "Complete your style profile first." };
    }
    return { ok: false, error: error instanceof Error ? error.message : "Failed to generate" };
  }
}

export async function setRecommendationStatus(
  id: string,
  status: "new" | "saved" | "dismissed"
): Promise<ActionResult> {
  const userId = await requireUserId();
  // Scope the update to the owner so users can't touch others' rows.
  const result = await prisma.recommendation.updateMany({
    where: { id, userId },
    data: { status },
  });
  if (result.count === 0) return { ok: false, error: "Not found" };
  revalidatePath("/feed");
  return { ok: true };
}

export async function scanEmailNow(): Promise<ActionResult<{ processed: number; imported: number }>> {
  if (!isAiConfigured()) return { ok: false, error: "AI is not configured (missing ANTHROPIC_API_KEY)" };
  const userId = await requireUserId();
  try {
    const result = await scanInbox(userId);
    revalidatePath("/purchases");
    return { ok: true, data: result };
  } catch (error) {
    if (error instanceof GmailAuthError) {
      return { ok: false, error: "Reconnect Google to grant inbox access, then try again." };
    }
    return { ok: false, error: error instanceof Error ? error.message : "Scan failed" };
  }
}
