import { NextRequest, NextResponse } from "next/server";
import {
  CUSTOMER_COOKIE,
  customerFromToken,
  sanitizeAddress,
  toPublic,
  updateCustomer,
} from "@/lib/customers";
import type { Address, Customer } from "@/lib/types";

// Avatars are stored inline as data URLs; keep them small (client downscales).
const MAX_AVATAR_LENGTH = 400_000;
const MAX_ADDRESSES = 10;

export async function GET(request: NextRequest) {
  const customer = await customerFromToken(
    request.cookies.get(CUSTOMER_COOKIE)?.value
  );
  if (!customer) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  return NextResponse.json(toPublic(customer));
}

// Update profile: name, avatar and the address book.
export async function PATCH(request: NextRequest) {
  const customer = await customerFromToken(
    request.cookies.get(CUSTOMER_COOKIE)?.value
  );
  if (!customer) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    name?: unknown;
    avatar?: unknown;
    addresses?: unknown;
  } | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const patch: Partial<Pick<Customer, "name" | "avatar" | "addresses">> = {};

  if (body.name !== undefined) {
    if (typeof body.name !== "string" || body.name.trim().length < 2) {
      return NextResponse.json(
        { error: "Name must be at least 2 characters." },
        { status: 400 }
      );
    }
    patch.name = body.name.trim().slice(0, 80);
  }

  if (body.avatar !== undefined) {
    if (body.avatar === null || body.avatar === "") {
      patch.avatar = "";
    } else if (
      typeof body.avatar !== "string" ||
      !body.avatar.startsWith("data:image/") ||
      body.avatar.length > MAX_AVATAR_LENGTH
    ) {
      return NextResponse.json(
        { error: "Avatar must be a small image." },
        { status: 400 }
      );
    } else {
      patch.avatar = body.avatar;
    }
  }

  if (body.addresses !== undefined) {
    if (!Array.isArray(body.addresses) || body.addresses.length > MAX_ADDRESSES) {
      return NextResponse.json(
        { error: `Addresses must be a list of at most ${MAX_ADDRESSES}.` },
        { status: 400 }
      );
    }
    const cleaned: Address[] = [];
    for (const raw of body.addresses) {
      const address = sanitizeAddress(raw);
      if (!address) {
        return NextResponse.json(
          { error: "Each address needs name, phone, address line, city, state and pincode." },
          { status: 400 }
        );
      }
      cleaned.push(address);
    }
    patch.addresses = cleaned;
  }

  const updated = updateCustomer(customer.id, patch);
  if (!updated) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }
  return NextResponse.json(toPublic(updated));
}

// Logout: clear the customer session cookie.
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(CUSTOMER_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
