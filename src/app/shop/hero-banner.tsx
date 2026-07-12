"use client";

import Image from "next/image";
import Link from "next/link";

export function HeroBanner() {
  return (
    <section className="relative overflow-hidden rounded-[32px] border border-line bg-[linear-gradient(135deg,#fff8f2_0%,#ffeede_100%)] shadow-[0_20px_70px_rgba(244,113,28,0.12)]">
      <div className="pointer-events-none absolute -left-16 top-10 h-56 w-56 rounded-full bg-accent/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-accent/50 to-transparent" />

      <div className="relative grid items-center gap-10 px-8 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:px-12 lg:py-14">
        <div className="max-w-2xl">
          <span className="inline-flex rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
            New season picks
          </span>
          <h2 className="mt-5 text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
            Smarter essentials for your{" "}
            <span className="text-brand-gradient">everyday life.</span>
          </h2>
          <p className="mt-4 max-w-xl text-lg text-muted">
            Shop curated wearables, audio, and home tech in one calm, premium experience designed for modern routines.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/shop"
              className="inline-flex items-center rounded-full bg-brand-gradient px-6 py-3 text-sm font-bold shadow-lg shadow-accent/25 transition hover:-translate-y-0.5 hover:brightness-110"
            >
              Explore products
            </Link>
            <Link
              href="/shop?cat=Wearables"
              className="inline-flex items-center rounded-full border border-line bg-white px-6 py-3 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent"
            >
              Discover wearables
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-4 text-sm text-muted">
            <span className="rounded-full bg-white px-3 py-2">Free shipping above ₹999</span>
            <span className="rounded-full bg-white px-3 py-2">Secure checkout</span>
            <span className="rounded-full bg-white px-3 py-2">Fast deliveries</span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[500px]">
          <div className="absolute inset-x-8 top-6 h-16 rounded-full bg-white/70 blur-2xl" />
          <div className="relative overflow-hidden rounded-[28px] border border-line bg-surface p-3 shadow-[0_18px_70px_rgba(0,0,0,0.6)]">
            <Image
              src="/hero-model.svg"
              alt="Buyzo lifestyle hero model"
              width={860}
              height={860}
              className="h-auto w-full rounded-[22px] object-cover"
              priority
            />
          </div>
          <div className="absolute -bottom-5 left-5 rounded-2xl border border-line bg-surface px-4 py-3 shadow-lg shadow-black/10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Today’s spotlight</p>
            <p className="mt-1 text-lg font-semibold text-foreground">Premium audio & wearables</p>
          </div>
        </div>
      </div>
    </section>
  );
}
