import { prisma } from "@/lib/db";

const GMAIL_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

export class GmailAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GmailAuthError";
  }
}

export type GmailMessage = {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  date?: string;
  body: string;
};

async function getFreshAccessToken(userId: string): Promise<string> {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
  });
  if (!account) throw new GmailAuthError("No Google account linked");

  const now = Math.floor(Date.now() / 1000);
  if (account.access_token && account.expires_at && account.expires_at - 60 > now) {
    return account.access_token;
  }
  if (!account.refresh_token) {
    throw new GmailAuthError("No refresh token — reconnect Google to grant inbox access");
  }

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      refresh_token: account.refresh_token,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new GmailAuthError("Failed to refresh Google access token");

  const data = (await res.json()) as { access_token: string; expires_in?: number };
  await prisma.account.update({
    where: { id: account.id },
    data: {
      access_token: data.access_token,
      expires_at: now + (data.expires_in ?? 3600),
    },
  });
  return data.access_token;
}

function decodeBase64Url(data: string): string {
  return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
}

type GmailPart = {
  mimeType?: string;
  body?: { data?: string };
  parts?: GmailPart[];
};

// Depth-first search for the best text representation of the message.
function extractBody(payload: GmailPart | undefined): string {
  if (!payload) return "";
  const plain = findByMime(payload, "text/plain");
  if (plain) return plain;
  const html = findByMime(payload, "text/html");
  if (html) return stripHtml(html);
  return "";
}

function findByMime(part: GmailPart, mime: string): string | null {
  if (part.mimeType === mime && part.body?.data) return decodeBase64Url(part.body.data);
  for (const child of part.parts ?? []) {
    const found = findByMime(child, mime);
    if (found) return found;
  }
  return null;
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export class GmailClient {
  constructor(private readonly userId: string) {}
  private token?: string;

  private async authorized<T>(path: string): Promise<T> {
    this.token ??= await getFreshAccessToken(this.userId);
    const res = await fetch(`${GMAIL_BASE}${path}`, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
    if (res.status === 401) throw new GmailAuthError("Gmail authorization expired");
    if (!res.ok) throw new Error(`Gmail API error ${res.status}`);
    return res.json() as Promise<T>;
  }

  async listMessageIds(query: string, max = 25): Promise<string[]> {
    const data = await this.authorized<{ messages?: Array<{ id: string }> }>(
      `/messages?q=${encodeURIComponent(query)}&maxResults=${max}`
    );
    return (data.messages ?? []).map((m) => m.id);
  }

  async getMessage(id: string): Promise<GmailMessage> {
    const data = await this.authorized<{
      snippet?: string;
      payload?: GmailPart & { headers?: Array<{ name: string; value: string }> };
    }>(`/messages/${id}?format=full`);

    const headers = data.payload?.headers ?? [];
    const header = (name: string) =>
      headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";

    return {
      id,
      from: header("from"),
      subject: header("subject"),
      date: header("date"),
      snippet: data.snippet ?? "",
      body: extractBody(data.payload),
    };
  }
}
