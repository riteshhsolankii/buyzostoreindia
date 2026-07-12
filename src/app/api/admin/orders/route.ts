import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, isValidSession } from "@/lib/auth";
import { listOrders } from "@/lib/orders";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!(await isValidSession(request.cookies.get(SESSION_COOKIE)?.value))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(listOrders(), {
    headers: { "Cache-Control": "no-store" },
  });
}
