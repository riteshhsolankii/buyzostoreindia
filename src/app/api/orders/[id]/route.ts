import { NextRequest, NextResponse } from "next/server";
import { CUSTOMER_COOKIE, customerFromToken } from "@/lib/customers";
import { cancelOrder, getCustomerOrder } from "@/lib/orders";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  const customer = await customerFromToken(
    request.cookies.get(CUSTOMER_COOKIE)?.value
  );
  if (!customer) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const { id } = await params;
  const order = await getCustomerOrder(id, customer.id);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  return NextResponse.json(order, { headers: { "Cache-Control": "no-store" } });
}

// A customer may cancel their own order while it hasn't shipped/delivered.
export async function DELETE(request: NextRequest, { params }: Context) {
  const customer = await customerFromToken(
    request.cookies.get(CUSTOMER_COOKIE)?.value
  );
  if (!customer) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const { id } = await params;
  const owned = await getCustomerOrder(id, customer.id);
  if (!owned) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (owned.status !== "placed" && owned.status !== "accepted") {
    return NextResponse.json(
      { error: "This order can no longer be cancelled." },
      { status: 409 }
    );
  }
  const result = await cancelOrder(id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result.order);
}
