import { randomBytes } from "crypto";

import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

// Local-only convenience login. Enabled by ALLOW_DEV_LOGIN=true so you can click
// through the app without configuring Google OAuth. Never enable in production.
const DEMO_EMAIL = "demo@atelier.local";

export async function GET(request: Request) {
  if (process.env.ALLOW_DEV_LOGIN !== "true") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: { email: DEMO_EMAIL, name: "Demo" },
  });

  const sessionToken = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await prisma.session.create({ data: { sessionToken, userId: user.id, expires } });

  const res = NextResponse.redirect(new URL("/", request.url));
  res.cookies.set("authjs.session-token", sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires,
  });
  return res;
}
