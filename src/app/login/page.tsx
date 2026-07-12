"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BuyzoMark } from "../shop/site-header";

const inputClass =
  "mt-1 w-full rounded-lg border border-line bg-surface-2 px-3.5 py-2.5 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Login failed. Please try again.");
      return;
    }
    const from = searchParams.get("from");
    const target = from && from.startsWith("/admin") ? from : "/admin";
    router.push(target);
    router.refresh();
  }

  return (
    <div className="animate-scale-in grid w-full max-w-4xl overflow-hidden rounded-3xl border border-line bg-surface/80 shadow-2xl shadow-black/10 backdrop-blur lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-brand-gradient p-10 lg:flex">
        <div className="pointer-events-none absolute -bottom-24 -right-24 opacity-15">
          <BuyzoMark size={360} />
        </div>
        <div className="relative">
          <span className="inline-flex items-center justify-center rounded-2xl bg-white p-3 shadow-lg shadow-black/20">
            <BuyzoMark size={44} />
          </span>
          <h2 className="mt-8 text-4xl font-extrabold leading-tight">
            Shop Smart.
            <br />
            Live Better.
          </h2>
          <p className="mt-4 max-w-xs text-sm font-medium text-white/80">
            One dashboard to run your entire Buyzo store.
          </p>
          <ul className="mt-8 space-y-3 text-sm font-semibold">
            {[
              "Manage products, prices & stock",
              "Track customer leads in real time",
              "Stock alerts before you run out",
            ].map((f, i) => (
              <li
                key={f}
                className="animate-slide-in flex items-center gap-3"
                style={{ animationDelay: `${200 + i * 100}ms` }}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-accent">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs font-semibold text-white/70">
          © 2026 Buyzo
        </p>
      </div>

      {/* Form panel */}
      <div className="p-8 sm:p-10">
        <div className="animate-fade-up mb-8 lg:text-left text-center">
          <span className="mb-4 inline-block lg:hidden">
            <BuyzoMark size={52} />
          </span>
          <h1 className="text-2xl font-extrabold">
            <span className="text-foreground">Buy</span>
            <span className="text-brand-gradient">zo</span>{" "}
            <span className="text-accent">Admin</span>
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            Sign in to manage the catalog and customer leads.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="animate-fade-up space-y-4" style={{ animationDelay: "120ms" }}>
          <label className="block">
            <span className="text-sm font-medium text-muted">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
              className={inputClass}
              placeholder="Enter your email address"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-muted">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className={inputClass}
              placeholder="Enter your password"
            />
          </label>
          {error && <p className="animate-fade-in text-sm text-danger">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-brand-gradient px-4 py-3 text-sm font-extrabold text-white shadow-lg shadow-accent/25 transition hover:shadow-accent/40 hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Sign in to dashboard"}
          </button>
        </form>

        <div className="animate-fade-up mt-6 border-t border-line pt-5 text-center text-xs text-muted" style={{ animationDelay: "200ms" }}>
          Customer?{" "}
          <Link href="/shop/account" className="font-bold text-accent hover:underline">
            Create your account in the shop →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden px-6 py-16">
      {/* Background: logo colors */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-accent/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-48 -right-32 h-96 w-96 rounded-full bg-accent-2/10 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
