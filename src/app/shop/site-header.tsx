"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/products";
import { useCart } from "./cart-context";

function ChevronDown() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path
        d="M2.5 4.5 6 8l3.5-3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="7" y="2.5" width="10" height="19" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10.5 18.5h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function HeadphonesIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 14v-2a8 8 0 0 1 16 0v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="3" y="13.5" width="4.5" height="7" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <rect x="16.5" y="13.5" width="4.5" height="7" rx="2" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M5 20c.8-3.5 3.6-5.5 7-5.5s6.2 2 7 5.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="25" height="25" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 20.5S3.5 15.5 3.5 9.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8.5 2.5c0 6-8.5 11-8.5 11z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 4h2.2l2 11.5a1.5 1.5 0 0 0 1.5 1.25h8.7a1.5 1.5 0 0 0 1.47-1.2L20.5 8H6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9.5" cy="20.5" r="1.4" fill="currentColor" />
      <circle cx="17" cy="20.5" r="1.4" fill="currentColor" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="m16 16 4.5 4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

/** Buyzo brand mark, redrawn from the logo: a bag-shaped "B" (yellow→green
 * gradient) with a white handle, black cart glyph and lime speed lines. */
export function BuyzoMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" aria-hidden>
      <defs>
        <linearGradient id="bz-lime" x1="0.2" y1="0" x2="0.7" y2="1">
          <stop offset="0%" stopColor="#e9ef35" />
          <stop offset="50%" stopColor="#b8dd26" />
          <stop offset="100%" stopColor="#8cc414" />
        </linearGradient>
      </defs>
      {/* speed lines */}
      <rect x="2" y="56" width="28" height="8" rx="4" fill="url(#bz-lime)" />
      <rect x="8" y="72" width="22" height="8" rx="4" fill="url(#bz-lime)" />
      <rect x="2" y="88" width="17" height="8" rx="4" fill="url(#bz-lime)" />
      {/* B stem + bag body */}
      <rect x="36" y="22" width="22" height="94" rx="11" fill="url(#bz-lime)" />
      <rect x="42" y="40" width="74" height="76" rx="20" fill="url(#bz-lime)" />
      {/* handle */}
      <path
        d="M66 42 a15 15 0 0 1 30 0"
        fill="none"
        stroke="#ffffff"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <circle cx="66" cy="44" r="7" fill="#ffffff" />
      <circle cx="66" cy="44" r="2.8" fill="#0d0d0d" />
      <circle cx="96" cy="44" r="7" fill="#ffffff" />
      <circle cx="96" cy="44" r="2.8" fill="#0d0d0d" />
      {/* cart */}
      <g stroke="#0a0a0a" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M56 64 h9 l8 29 h27 l7 -21 h-37" />
      </g>
      <circle cx="77" cy="104" r="5.5" fill="#0a0a0a" />
      <circle cx="97" cy="104" r="5.5" fill="#0a0a0a" />
    </svg>
  );
}

export function BuyzoLogo({ tagline = false }: { tagline?: boolean }) {
  return (
    <Link href="/shop" className="group flex items-center gap-2.5">
      <span className="transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105">
        <BuyzoMark />
      </span>
      <span className="leading-none">
        <span className="block text-[26px] font-extrabold tracking-tight">
          <span className="text-white">Buy</span>
          <span className="text-brand-gradient">zo</span>
        </span>
        {tagline && (
          <span className="mt-1 block text-[9px] font-medium tracking-[0.18em] text-white/50">
            SHOP MORE. PAY LESS. LIVE BETTER.
          </span>
        )}
      </span>
    </Link>
  );
}

const badgeClass =
  "absolute -top-1.5 -right-2 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold text-black";

export function SiteHeader() {
  const { count, total } = useCart();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [term, setTerm] = useState("");
  const [cat, setCat] = useState("All");

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data: Product[]) => setProducts(data))
      .catch(() => {});
  }, []);

  const categories = ["All", ...Array.from(new Set(products.map((p) => p.category)))];

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (term.trim()) params.set("q", term.trim());
    if (cat !== "All") params.set("cat", cat);
    router.push(`/shop${params.size ? `?${params}` : ""}`);
  }

  return (
    <header className="z-40">
      {/* Top bar */}
      <div className="border-b border-white/5 bg-black text-[13px] text-white/70">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2.5">
          <nav className="flex items-center gap-7">
            <Link href="/shop" className="transition hover:text-accent">
              About Us
            </Link>
            <Link href="/shop/account" className="transition hover:text-accent">
              My account
            </Link>
            <Link href="/shop" className="transition hover:text-accent">
              Featured Products
            </Link>
            <Link href="/shop" className="transition hover:text-accent">
              Wishlist
            </Link>
          </nav>
          <div className="hidden items-center gap-7 sm:flex">
            <span className="hidden font-medium tracking-wide text-accent/90 md:block">
              Shop More. Pay Less. Live Better.
            </span>
            <Link href="/shop" className="transition hover:text-accent">
              Order Tracking
            </Link>
            <button type="button" className="flex items-center gap-1.5 transition hover:text-accent">
              English <ChevronDown />
            </button>
            <button type="button" className="flex items-center gap-1.5 transition hover:text-accent">
              USD <ChevronDown />
            </button>
          </div>
        </div>
      </div>

      {/* Main bar */}
      <div className="bg-[#0d0d0d] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-6 py-4">
          <BuyzoLogo tagline />

          <nav className="hidden items-center gap-8 text-[15px] font-semibold lg:flex">
            <Link href="/shop" className="flex items-center gap-1.5 transition hover:text-accent">
              Home <ChevronDown />
            </Link>
            <Link href="/shop" className="flex items-center gap-1.5 transition hover:text-accent">
              Shop <ChevronDown />
            </Link>
            <Link href="/shop?cat=Wearables" className="flex items-center gap-2 transition hover:text-accent">
              <PhoneIcon /> Wearables
            </Link>
            <Link href="/shop?cat=Audio" className="flex items-center gap-2 transition hover:text-accent">
              <HeadphonesIcon /> Audio
            </Link>
            <Link href="/shop" className="transition hover:text-accent">
              Blog
            </Link>
            <Link href="/shop" className="transition hover:text-accent">
              Contact
            </Link>
          </nav>

          <div className="flex items-center gap-6">
            <Link href="/shop/account" className="flex items-center gap-2.5 transition hover:text-accent">
              <UserIcon />
              <span className="hidden leading-tight md:block">
                <span className="block text-xs text-white/50">Sign In</span>
                <span className="block text-[15px] font-semibold">Account</span>
              </span>
            </Link>

            <Link href="/shop" className="relative transition hover:text-accent" aria-label="Wishlist">
              <HeartIcon />
              <span className={badgeClass}>0</span>
            </Link>

            <Link href="/shop/cart" className="flex items-center gap-3 transition hover:text-accent">
              <span className="relative">
                <CartIcon />
                <span className={badgeClass}>{count}</span>
              </span>
              <span className="hidden leading-tight md:block">
                <span className="block text-xs text-white/50">Total</span>
                <span className="block text-[15px] font-semibold">${total.toFixed(2)}</span>
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Lime search bar */}
      <div className="bg-brand-gradient text-black">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-6 px-6 py-3.5">
          <button type="button" className="flex items-center gap-4" aria-label="All departments">
            <svg width="24" height="18" viewBox="0 0 24 18" aria-hidden>
              <rect width="24" height="2.4" rx="1.2" fill="#0a0a0a" />
              <rect y="7.8" width="24" height="2.4" rx="1.2" fill="#0a0a0a" />
              <rect y="15.6" width="24" height="2.4" rx="1.2" fill="#0a0a0a" />
            </svg>
            <span className="text-left leading-tight">
              <span className="block text-[15px] font-bold">All Departments for you</span>
              <span className="block text-xs text-black/60">
                Total {products.length} Products
              </span>
            </span>
          </button>

          <span className="ml-auto hidden text-[15px] font-bold md:block">
            What are you looking for ?
          </span>

          <form
            onSubmit={handleSearch}
            className="flex h-12 w-full max-w-xl flex-1 items-stretch overflow-hidden rounded-lg bg-white shadow-lg shadow-black/10"
          >
            <select
              value={cat}
              onChange={(e) => setCat(e.target.value)}
              className="border-r border-gray-200 bg-white pl-4 pr-2 text-sm font-medium text-black outline-none"
              aria-label="Category"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <span className="flex items-center pl-3 text-gray-400">
              <SearchIcon />
            </span>
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search your favorite product..."
              className="min-w-0 flex-1 bg-white px-3 text-sm text-black placeholder:text-gray-400 outline-none"
            />
            <button
              type="submit"
              className="bg-black px-8 text-sm font-semibold text-accent transition hover:bg-[#1c1c1c]"
            >
              Search
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
