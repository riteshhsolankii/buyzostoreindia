"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/products";
import { useCart } from "./cart-context";

const BRAND_BLUE = "#2e6ff2";

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

/** Buyzo brand mark — bag-shaped "B" in a solid blue tone with a navy handle and white cart glyph. */
export function BuyzoMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" aria-hidden>
      <rect x="2" y="56" width="28" height="8" rx="4" fill="#2e6ff2" />
      <rect x="8" y="72" width="22" height="8" rx="4" fill="#2e6ff2" />
      <rect x="2" y="88" width="17" height="8" rx="4" fill="#2e6ff2" />
      <rect x="36" y="22" width="22" height="94" rx="11" fill="#2e6ff2" />
      <rect x="42" y="40" width="74" height="76" rx="20" fill="#2e6ff2" />
      <path
        d="M66 42 a15 15 0 0 1 30 0"
        fill="none"
        stroke={BRAND_BLUE}
        strokeWidth="9"
        strokeLinecap="round"
      />
      <circle cx="66" cy="44" r="7" fill={BRAND_BLUE} />
      <circle cx="66" cy="44" r="2.8" fill="#ffffff" />
      <circle cx="96" cy="44" r="7" fill={BRAND_BLUE} />
      <circle cx="96" cy="44" r="2.8" fill="#ffffff" />
      <g stroke="#ffffff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M56 64 h9 l8 29 h27 l7 -21 h-37" />
      </g>
      <circle cx="77" cy="104" r="5.5" fill="#ffffff" />
      <circle cx="97" cy="104" r="5.5" fill="#ffffff" />
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
          <span className="text-accent">Buy</span>
          <span className="text-brand-gradient">zo</span>
        </span>
        {tagline && (
          <span className="mt-1 block text-[9px] font-semibold tracking-[0.18em] text-muted">
            SMARTER SHOPPING STARTS HERE
          </span>
        )}
      </span>
    </Link>
  );
}

const badgeClass =
  "absolute -top-1.5 -right-2 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-brand-gradient px-1 text-[11px] font-bold text-white";

export function SiteHeader() {
  const { count } = useCart();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [term, setTerm] = useState("");
  const [shopMenuOpen, setShopMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data: Product[]) =>
        setProducts(
          data.filter((p) => {
            const s = p.extras?.status;
            return !s || s === "active" || s === "out-of-stock";
          })
        )
      )
      .catch(() => {});

    const stored = window.localStorage.getItem("buyzo-customer");
    setLoggedIn(Boolean(stored));
  }, []);

  const shopCategories = useMemo(() => {
    const base = ["Wearables", "Audio", "Accessories", "Smart Home", "Gaming"];
    const fromProducts = products.map((p) => p.category).filter(Boolean);
    return Array.from(new Set([...base, ...fromProducts])).slice(0, 8);
  }, [products]);

  const suggestions = useMemo(() => {
    const q = term.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter((p) => {
        const haystack = `${p.name} ${p.category} ${p.extras?.sku ?? ""}`.toLowerCase();
        return haystack.includes(q);
      })
      .slice(0, 6);
  }, [products, term]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (term.trim()) params.set("q", term.trim());
    router.push(`/shop${params.size ? `?${params}` : ""}`);
  }

  function handleSignOut() {
    window.localStorage.removeItem("buyzo-customer");
    setLoggedIn(false);
    setAccountOpen(false);
  }

  return (
    <header className="z-40">
      <div className="bg-accent text-[13px] text-white/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-2.5">
          <span className="hidden font-semibold tracking-wide text-white md:block">
            Smarter Shopping Starts Here
          </span>
          <nav className="flex items-center gap-5 sm:gap-7">
            <Link href="/shop" className="transition hover:text-white">
              Order Tracking
            </Link>
            <button type="button" className="flex items-center gap-1.5 transition hover:text-white">
              English <ChevronDown />
            </button>
            <button type="button" className="flex items-center gap-1.5 transition hover:text-white">
              INR <ChevronDown />
            </button>
          </nav>
        </div>
      </div>

      <div className="border-b border-line bg-white text-accent">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <BuyzoLogo tagline />

          <nav className="hidden items-center gap-8 text-[15px] font-semibold lg:flex">
            <Link href="/shop" className="transition hover:text-accent">
              Shop
            </Link>
            <div
              className="relative"
              onMouseEnter={() => setShopMenuOpen(true)}
              onMouseLeave={() => setShopMenuOpen(false)}
            >
              <button type="button" className="flex items-center gap-1.5 transition hover:text-accent">
                Categories <ChevronDown />
              </button>
              {shopMenuOpen && (
                <div className="absolute left-0 top-full z-50 mt-3 w-[560px] rounded-2xl border border-line bg-white p-5 shadow-2xl shadow-black/10">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {shopCategories.map((category) => (
                      <Link
                        key={category}
                        href={`/shop?cat=${encodeURIComponent(category)}`}
                        className="rounded-xl border border-line bg-surface-2/60 px-3 py-2.5 text-sm font-semibold text-foreground transition hover:border-accent hover:bg-white hover:text-accent"
                      >
                        {category}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
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

          <div className="flex items-center gap-4 sm:gap-6">
            <div className="relative">
              <button
                type="button"
                onClick={() => setAccountOpen((s) => !s)}
                className="flex items-center gap-2.5 transition hover:text-accent"
                aria-label="Account"
              >
                <UserIcon />
              </button>
              {accountOpen && (
                <div className="absolute right-0 top-full z-50 mt-3 w-56 rounded-2xl border border-line bg-white p-3 shadow-2xl shadow-black/10">
                  {loggedIn ? (
                    <>
                      <Link href="/shop/account" className="block rounded-lg px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-surface-2">
                        My profile
                      </Link>
                      <button type="button" onClick={handleSignOut} className="mt-1 block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-muted transition hover:bg-surface-2 hover:text-foreground">
                        Sign out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link href="/shop/account" className="block rounded-lg px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-surface-2">
                        Sign in
                      </Link>
                      <Link href="/shop/account" className="mt-1 block rounded-lg px-3 py-2 text-sm font-semibold text-muted transition hover:bg-surface-2 hover:text-foreground">
                        Create account
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            <Link href="/shop/cart" className="relative transition hover:text-accent" aria-label="Cart">
              <CartIcon />
              <span className={badgeClass}>{count}</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-brand-gradient text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-6 py-3.5">
          <form onSubmit={handleSearch} className="relative flex h-12 flex-1 items-stretch overflow-visible rounded-lg bg-white shadow-lg shadow-black/10">
            <span className="flex items-center pl-3 text-gray-400">
              <SearchIcon />
            </span>
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search your favorite product..."
              className="min-w-0 flex-1 bg-white px-3 text-sm text-accent placeholder:text-gray-400 outline-none"
            />
            <button type="submit" className="bg-accent px-8 text-sm font-semibold text-white transition hover:bg-accent-hover">
              Search
            </button>
            {suggestions.length > 0 && (
              <div className="absolute left-0 top-full z-40 mt-2 w-full rounded-xl border border-line bg-white p-2 shadow-xl shadow-black/10">
                {suggestions.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setTerm(p.name);
                      router.push(`/shop/products/${p.id}`);
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-foreground transition hover:bg-surface-2"
                  >
                    <span>{p.name}</span>
                    <span className="text-xs text-muted">{p.category}</span>
                  </button>
                ))}
              </div>
            )}
          </form>
        </div>
      </div>
    </header>
  );
}
