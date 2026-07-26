import { NextResponse } from "next/server";
import { verifyOtp } from "@/lib/otp";

export const dynamic = "force-dynamic";

const messages: Record<string, string> = {
  expired: "This code has expired. Please request a new one.",
  invalid: "Incorrect code. Please check and try again.",
  "too-many-attempts": "Too many attempts. Please request a new code.",
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    email?: string;
    code?: string;
  } | null;

  const result = await verifyOtp(body?.email ?? "", body?.code ?? "");
  if (result !== "ok") {
    return NextResponse.json({ error: messages[result] }, { status: 400 });
  }
  return NextResponse.json({ verified: true });
}
