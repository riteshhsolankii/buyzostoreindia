import Link from "next/link";

export default function CouponCreatePage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div>
        <Link href="/admin" className="text-sm text-muted transition hover:text-accent">
          ← Admin Dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Create Coupon</h1>
        <p className="mt-2 text-sm text-muted">
          Add a new coupon code for discounts and promotions.
        </p>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-muted">Coupon Code</span>
            <input
              className="w-full rounded-lg border border-line bg-surface-2 px-3.5 py-2.5 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              placeholder="SAVE10"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-muted">Discount (%)</span>
            <input
              type="number"
              className="w-full rounded-lg border border-line bg-surface-2 px-3.5 py-2.5 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              placeholder="10"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-muted">Valid From</span>
            <input
              type="date"
              className="w-full rounded-lg border border-line bg-surface-2 px-3.5 py-2.5 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-muted">Valid Until</span>
            <input
              type="date"
              className="w-full rounded-lg border border-line bg-surface-2 px-3.5 py-2.5 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </label>
        </div>

        <div className="mt-6 rounded-xl border border-line bg-surface-2/60 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Apply to product</h2>
              <p className="mt-1 text-sm text-muted">
                Use this coupon for a specific product. Search and select the product below.
              </p>
            </div>
            <label className="flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-sm text-muted">
              <input type="checkbox" className="h-4 w-4 rounded border-line text-accent focus:ring-accent" />
              <span>Use for this product only</span>
            </label>
          </div>

          <div className="mt-4 space-y-3">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-muted">Search product</span>
              <input
                className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                placeholder="Type product name, SKU or category"
              />
            </label>

            <div className="rounded-lg border border-line bg-white p-3">
              <div className="flex items-center justify-between rounded-lg border border-dashed border-line px-3 py-2 text-sm text-muted">
                <span>Select a product to make this coupon applicable</span>
                <span className="font-semibold text-accent">Search</span>
              </div>
            </div>
          </div>
        </div>

        <label className="mt-6 block">
          <span className="mb-1 block text-sm font-medium text-muted">Description</span>
          <textarea
            rows={4}
            className="w-full rounded-lg border border-line bg-surface-2 px-3.5 py-2.5 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            placeholder="Optional note for the coupon"
          />
        </label>

        <button
          type="button"
          className="mt-6 rounded-lg bg-brand-gradient px-5 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-accent/20 transition hover:brightness-110"
        >
          Save Coupon
        </button>
      </div>
    </div>
  );
}
