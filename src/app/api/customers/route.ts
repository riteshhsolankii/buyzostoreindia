import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, isValidSession } from "@/lib/auth";
import {
  CUSTOMER_COOKIE,
  CUSTOMER_MAX_AGE,
  createCustomer,
  customerToken,
  findCustomerByEmail,
  listCustomers,
  normalizePhone,
  toPublic,
} from "@/lib/customers";
import { consumeOtp, isTargetVerified } from "@/lib/otp";
import { sendWelcomeEmail } from "@/lib/mailer";

// Admin-only: list every registered customer (leads).
export async function GET(request: NextRequest) {
  const admin = await isValidSession(
    request.cookies.get(SESSION_COOKIE)?.value
  );
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await listCustomers());
}

function passwordProblem(password: string): string | null {
  if (password.length < 8) return "at least 8 characters";
  if (!/[A-Z]/.test(password)) return "an uppercase letter";
  if (!/[a-z]/.test(password)) return "a lowercase letter";
  if (!/\d/.test(password)) return "a number";
  if (!/[^A-Za-z0-9]/.test(password)) return "a special character";
  return null;
}

// Public: customer registration.
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
  } | null;

  const name = body?.name?.trim();
  const email = body?.email?.trim().toLowerCase();
  const phone = body?.phone?.trim() ?? "";
  const password = body?.password ?? "";

  if (!name || !email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json(
      { error: "A valid name and email are required." },
      { status: 400 }
    );
  }
  const problem = passwordProblem(password);
  if (problem) {
    return NextResponse.json(
      { error: `Password needs ${problem}.` },
      { status: 400 }
    );
  }
  // The email must have been proved reachable by entering the mailed code.
  if (!(await isTargetVerified(email))) {
    return NextResponse.json(
      { error: "Please verify your email with the code we sent you first." },
      { status: 400 }
    );
  }
  if (await findCustomerByEmail(email)) {
    return NextResponse.json(
      { error: "An account with this email already exists. Please sign in." },
      { status: 409 }
    );
  }

  const customer = await createCustomer({
    name,
    email,
    phone: phone ? normalizePhone(phone) : "",
    password,
  });
  await consumeOtp(email);

  // Plain-text welcome mail; real delivery needs RESEND_API_KEY in .env.local.
  const emailSent = await sendWelcomeEmail(email, name);

  const res = NextResponse.json(
    { ...toPublic(customer), emailSent },
    { status: 201 }
  );
  res.cookies.set(CUSTOMER_COOKIE, await customerToken(customer.id), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: CUSTOMER_MAX_AGE,
  });
  return res;
}
