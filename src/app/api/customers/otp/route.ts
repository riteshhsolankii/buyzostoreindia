import { NextResponse } from "next/server";
import { isValidPhone, requestOtp } from "@/lib/otp";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    phone?: string;
  } | null;
  const phone = body?.phone ?? "";

  if (!isValidPhone(phone)) {
    return NextResponse.json(
      { error: "Please enter a valid phone number." },
      { status: 400 }
    );
  }

  const code = requestOtp(phone);

  // No SMS gateway is configured for this demo store, so the code is returned
  // to the client and shown on screen. Hook a real provider in here (Twilio,
  // MSG91, …) and stop returning demoCode for production.
  return NextResponse.json({ sent: true, expiresInSeconds: 300, demoCode: code });
}
