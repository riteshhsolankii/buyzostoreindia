import { NextResponse } from "next/server";
import {
  CUSTOMER_COOKIE,
  CUSTOMER_MAX_AGE,
  customerToken,
  toPublic,
  verifyCustomer,
} from "@/lib/customers";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    email?: string;
    password?: string;
  } | null;

  const customer = await verifyCustomer(
    body?.email ?? "",
    body?.password ?? ""
  );
  if (!customer) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 }
    );
  }

  const res = NextResponse.json(toPublic(customer));
  res.cookies.set(CUSTOMER_COOKIE, await customerToken(customer.id), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: CUSTOMER_MAX_AGE,
  });
  return res;
}
