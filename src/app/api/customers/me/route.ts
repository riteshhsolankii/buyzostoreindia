import { NextRequest, NextResponse } from "next/server";
import {
  CUSTOMER_COOKIE,
  customerFromToken,
  toPublic,
} from "@/lib/customers";

export async function GET(request: NextRequest) {
  const customer = await customerFromToken(
    request.cookies.get(CUSTOMER_COOKIE)?.value
  );
  if (!customer) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  return NextResponse.json(toPublic(customer));
}

// Logout: clear the customer session cookie.
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(CUSTOMER_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
