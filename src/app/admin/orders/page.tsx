import { listOrders } from "@/lib/orders";
import { OrdersBoard } from "./orders-board";

export const dynamic = "force-dynamic";

export default function AdminOrdersPage() {
  const orders = listOrders();
  return (
    <div className="w-full">
      <div className="animate-fade-up mb-8">
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="mt-1 text-sm text-muted">
          {orders.length === 0
            ? "Customer orders will appear here as they check out."
            : `${orders.length} order${orders.length === 1 ? "" : "s"} placed by customers.`}
        </p>
      </div>
      <OrdersBoard initialOrders={orders} />
    </div>
  );
}
