import { listCustomers } from "@/lib/customers";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const customers = await listCustomers();

  return (
    <div className="w-full">
      <div className="animate-fade-up mb-8">
        <h1 className="text-2xl font-bold">Customers</h1>
        <p className="mt-1 text-sm text-muted">
          {customers.length === 0
            ? "Leads from shop registrations will appear here."
            : `${customers.length} lead${customers.length === 1 ? "" : "s"} captured from the shop.`}
        </p>
      </div>

      {customers.length === 0 ? (
        <div className="animate-fade-up rounded-2xl border border-dashed border-line bg-surface px-6 py-16 text-center" style={{ animationDelay: "100ms" }}>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-2xl">
            👥
          </div>
          <h2 className="font-semibold">No customer accounts yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            When a visitor creates an account on the shop&apos;s{" "}
            <span className="text-accent">My account</span> page, their name,
            email and phone number land here as a lead.
          </p>
        </div>
      ) : (
        <div className="animate-fade-up overflow-x-auto rounded-2xl border border-line bg-surface" style={{ animationDelay: "100ms" }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-muted">
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Phone</th>
                <th className="px-5 py-3 font-medium text-right">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {customers.map((c, i) => (
                <tr
                  key={c.id}
                  className="animate-fade-up transition hover:bg-surface-2"
                  style={{ animationDelay: `${150 + Math.min(i, 10) * 50}ms` }}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-gradient text-sm font-extrabold text-on-accent">
                        {c.name.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="font-medium">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-muted">{c.email}</td>
                  <td className="px-5 py-4 text-muted">{c.phone || "—"}</td>
                  <td className="px-5 py-4 text-right text-muted">
                    {new Date(c.createdAt).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
