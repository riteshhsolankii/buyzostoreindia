"use client";

import Link from "next/link";

export function AuthModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="animate-scale-in w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-2xl shadow-black/10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Account needed</p>
            <h3 className="mt-2 text-2xl font-semibold text-foreground">Please sign in or create an account</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-muted transition hover:bg-surface-2 hover:text-foreground"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <p className="mt-3 text-sm leading-7 text-muted">
          You need an account to add items to your cart and continue shopping.
        </p>
        <div className="mt-5 flex flex-col gap-3">
          <Link
            href="/shop/account"
            className="rounded-2xl bg-brand-gradient px-4 py-3 text-center text-sm font-bold transition hover:brightness-110"
            onClick={onClose}
          >
            Create account
          </Link>
          <Link
            href="/shop/account"
            className="rounded-2xl border border-line bg-surface-2 px-4 py-3 text-center text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent"
            onClick={onClose}
          >
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
