import { NextRequest, NextResponse } from "next/server";
import { CUSTOMER_COOKIE, customerFromToken } from "@/lib/customers";
import { createOrder, listCustomerOrders } from "@/lib/orders";
import { sanitizeAddress } from "@/lib/customers";

export const dynamic = "force-dynamic";

const MAX_ITEMS = 50;

export async function GET(request: NextRequest) {
  const customer = await customerFromToken(
    request.cookies.get(CUSTOMER_COOKIE)?.value
  );
  if (!customer) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  return NextResponse.json(listCustomerOrders(customer.id), {
    headers: { "Cache-Control": "no-store" },
  });
}

// Place an order. The client sends line items (product id + quantity) and the
// id of a saved address; prices are recomputed on the server.
export async function POST(request: NextRequest) {
  const customer = await customerFromToken(
    request.cookies.get(CUSTOMER_COOKIE)?.value
  );
  if (!customer) {
    return NextResponse.json({ error: "Please sign in to place an order." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    items?: unknown;
    addressId?: unknown;
    note?: unknown;
  } | null;
  if (!body || !Array.isArray(body.items)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (body.items.length === 0 || body.items.length > MAX_ITEMS) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  }

  // Normalise line items.
  const items: { productId: string; quantity: number }[] = [];
  for (const raw of body.items) {
    const item = raw as { productId?: unknown; quantity?: unknown };
    const productId = typeof item.productId === "string" ? item.productId : "";
    const quantity = Number(item.quantity);
    if (!productId || !Number.isFinite(quantity) || quantity < 1) {
      return NextResponse.json({ error: "Invalid cart item." }, { status: 400 });
    }
    items.push({ productId, quantity: Math.trunc(quantity) });
  }

  // Resolve the delivery address from the customer's saved book.
  const addresses = customer.addresses ?? [];
  const address =
    addresses.find((a) => a.id === body.addressId) ??
    (addresses.length === 1 ? addresses[0] : undefined);
  if (!address || !sanitizeAddress(address)) {
    return NextResponse.json(
      { error: "Choose a valid delivery address before checking out." },
      { status: 400 }
    );
  }

  const note = typeof body.note === "string" ? body.note.slice(0, 500) : undefined;
  const result = createOrder({ customerId: customer.id, items, address, note });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result.order, { status: 201 });
}
