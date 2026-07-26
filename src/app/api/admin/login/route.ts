import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  getSessionToken,
  isAdminCredentials,
} from "@/lib/auth";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    email?: string;
    password?: string;
  } | null;

  let token: string;
  try {
    if (!isAdminCredentials(body?.email, body?.password)) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }
    token = await getSessionToken();
  } catch (error) {
    // ADMIN_EMAIL / ADMIN_PASSWORD are missing. Say so instead of letting the
    // throw become an empty 500 that looks like a wrong password.
    console.error("[buyzo-auth] admin sign-in is not configured:", error);
    return NextResponse.json(
      {
        error:
          "Admin sign-in is not configured on this server. ADMIN_EMAIL and ADMIN_PASSWORD must be set.",
      },
      { status: 500 }
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
