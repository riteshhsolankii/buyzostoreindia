import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, isValidSession } from "@/lib/auth";
import {
  acceptOrder,
  cancelOrder,
  deliverOrder,
  getOrder,
  shipOrder,
  type OrderResult,
} from "@/lib/orders";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  if (!(await isValidSession(request.cookies.get(SESSION_COOKIE)?.value))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  return NextResponse.json(order, { headers: { "Cache-Control": "no-store" } });
}

// Advance an order through its lifecycle:
// { action: "accept", deliveryDays: 3 } | "ship" | "deliver" | "cancel"
export async function PATCH(request: NextRequest, { params }: Context) {
  if (!(await isValidSession(request.cookies.get(SESSION_COOKIE)?.value))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as {
    action?: string;
    deliveryDays?: unknown;
  } | null;

  switch (body?.action) {
    case "accept": {
      const days = Number(body.deliveryDays);
      if (!Number.isFinite(days) || days < 0 || days > 60) {
        return NextResponse.json(
          { error: "Enter a delivery window between 0 and 60 days." },
          { status: 400 }
        );
      }
      return respond(acceptOrder(id, days));
    }
    case "ship":
      return respond(shipOrder(id));
    case "deliver":
      return respond(deliverOrder(id));
    case "cancel":
      return respond(cancelOrder(id));
    default:
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }
}

async function respond(pending: Promise<OrderResult>) {
  const result = await pending;
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result.order);
}
