"use client";

import Image from "next/image";
import Link from "next/link";

export function HeroBanner() {
  return (
    <section className="relative overflow-hidden rounded-[32px] border border-line bg-[linear-gradient(135deg,#f8fbff_0%,#eef5ff_100%)] shadow-[0_20px_70px_rgba(46,111,242,0.12)]">
      <div className="pointer-events-none absolute -left-16 top-10 h-56 w-56 rounded-full bg-brand-gradient/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />

      <div className="relative grid items-center gap-10 px-8 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:px-12 lg:py-14">
        <div className="max-w-2xl">
          <span className="inline-flex rounded-full border border-accent/15 bg-white px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
            New season picks
          </span>
          <h2 className="mt-5 text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
            Smarter essentials for your everyday life.
          </h2>
          <p className="mt-4 max-w-xl text-lg text-muted">
            Shop curated wearables, audio, and home tech in one calm, premium experience designed for modern routines.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/shop" className="inline-flex items-center rounded-full bg-brand-gradient px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:-translate-y-0.5">
              Explore products
            </Link>
            <Link href="/shop?cat=Wearables" className="inline-flex items-center rounded-full border border-line bg-white px-6 py-3 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent">
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
          <div className="relative overflow-hidden rounded-[28px] border border-white/80 bg-white p-3 shadow-[0_18px_70px_rgba(8,22,52,0.14)]">
            <Image src="/hero-model.svg" alt="Buyzo lifestyle hero model" width={860} height={860} className="h-auto w-full rounded-[22px] object-cover" priority />
          </div>
          <div className="absolute -bottom-5 left-5 rounded-2xl border border-line bg-white px-4 py-3 shadow-lg shadow-black/10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Today’s spotlight</p>
            <p className="mt-1 text-lg font-semibold text-foreground">Premium audio & wearables</p>
          </div>
        </div>
      </div>
    </section>
  );
}
