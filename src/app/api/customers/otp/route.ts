import { NextResponse } from "next/server";
import { sendOtpEmail } from "@/lib/mailer";
import { isValidEmail, pruneExpiredOtps, requestOtp } from "@/lib/otp";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    email?: string;
  } | null;
  const email = body?.email ?? "";

  if (!isValidEmail(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  const issued = await requestOtp(email);
  if (!issued.ok) {
    return NextResponse.json(
      {
        error: `Please wait ${issued.retryInSeconds}s before requesting another code.`,
      },
      { status: 429 }
    );
  }

  // The code is never returned to the client — a code the browser can read is
  // not a verification. With no RESEND_API_KEY configured it is only printed to
  // the server console (demo mode), which keeps local development usable; a
  // provider that actually rejects the send is a real error.
  const result = await sendOtpEmail(email, issued.code);
  if (result === "failed") {
    return NextResponse.json(
      { error: "Could not send the code right now. Please try again." },
      { status: 502 }
    );
  }

  await pruneExpiredOtps();

  return NextResponse.json({
    sent: true,
    expiresInSeconds: issued.expiresInSeconds,
    // Tells the UI to explain where the code went while no mail provider is set.
    demoMode: result === "demo",
  });
}
