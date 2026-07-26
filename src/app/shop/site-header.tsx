"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/products";
import { useCart } from "./cart-context";
import { useCustomer } from "./customer-context";
import { useWishlist } from "./wishlist-context";

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
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
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

export function HeartIcon({ filled = false, size = 24 }: { filled?: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} aria-hidden>
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
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
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
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="m16 16 4.5 4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M15 8l4 4-4 4M19 12H9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Brand artwork lives in /public/logo. `logo.svg` is the supplied master;
 * the other two are viewBox crops of it (identical paths), so all three stay
 * in sync if the master is replaced.
 *   ASPECT[x] = intrinsic width / height, used to reserve space and avoid
 *   layout shift while the asset loads.
 */
const LOGO = {
  mark: { src: "/logo/logo-mark.svg", ratio: 1486 / 1772 },
  lockup: { src: "/logo/logo-lockup.svg", ratio: 6328 / 1772 },
  full: { src: "/logo/logo.svg", ratio: 6328 / 2507 },
} as const;

function BuyzoArt({
  variant,
  height,
  alt,
  className,
}: {
  variant: keyof typeof LOGO;
  height: number;
  alt: string;
  className?: string;
}) {
  const art = LOGO[variant];
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={art.src}
      alt={alt}
      aria-hidden={alt === "" || undefined}
      width={Math.round(height * art.ratio)}
      height={height}
      // Explicit width/height reserve the box; `width:auto` keeps the ratio
      // exact even if a parent constrains the height.
      style={{ height, width: "auto" }}
      className={className}
    />
  );
}

/**
 * Buyzo bag mark (the fused bag/"B"). `size` is the rendered height; width
 * follows the artwork's own ratio rather than being forced square.
 */
export function BuyzoMark({ size = 40 }: { size?: number }) {
  return <BuyzoArt variant="mark" height={size} alt="" />;
}

/**
 * Wordmark lockup for places that supply their own link/heading.
 * `tagline` picks the artwork that includes "Shop Smart. Live Better."
 */
export function BuyzoLockup({
  height = 30,
  tagline = false,
  className,
}: {
  height?: number;
  tagline?: boolean;
  className?: string;
}) {
  return (
    <BuyzoArt
      variant={tagline ? "full" : "lockup"}
      height={height}
      alt="Buyzo"
      className={className}
    />
  );
}

/** Header logo — the lockup wrapped in a link home. */
export function BuyzoLogo({ tagline = false }: { tagline?: boolean }) {
  return (
    <Link href="/shop" className="group flex items-center" aria-label="Buyzo — home">
      <BuyzoLockup
        height={tagline ? 48 : 34}
        tagline={tagline}
        className="transition-transform duration-300 group-hover:scale-[1.03]"
      />
    </Link>
  );
}

const badgeClass =
  "absolute -top-1.5 -right-2 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-brand-gradient px-1 text-[11px] font-bold";

const menuItemClass =
  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-foreground transition hover:bg-surface-2";

export function SiteHeader() {
  const { count } = useCart();
  const { count: wishlistCount } = useWishlist();
  const { customer, signOut } = useCustomer();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [term, setTerm] = useState("");
  const [shopMenuOpen, setShopMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement | null>(null);

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
  }, []);

  // Clicking anywhere outside closes the account menu.
  useEffect(() => {
    if (!accountOpen) return;
    function onPointerDown(e: PointerEvent) {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    }
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [accountOpen]);

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

  async function handleSignOut() {
    await signOut();
    setAccountOpen(false);
    router.push("/shop");
  }

  return (
    <header className="z-40">
      <div className="bg-brand-gradient text-[13px]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-2">
          <span className="hidden font-bold tracking-wide md:block">
            Shop Smart. Live Better.
          </span>
          <nav className="flex items-center gap-5 font-semibold sm:gap-7">
            <Link href="/shop" className="transition hover:opacity-70">
              Order Tracking
            </Link>
            <button type="button" className="flex items-center gap-1.5 transition hover:opacity-70">
              English <ChevronDown />
            </button>
            <button type="button" className="flex items-center gap-1.5 transition hover:opacity-70">
              INR <ChevronDown />
            </button>
          </nav>
        </div>
      </div>

      <div className="border-b border-line bg-surface text-foreground">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3.5">
          {/* No tagline here — the lime utility bar above already carries it. */}
          <BuyzoLogo />

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
                <div className="absolute left-0 top-full z-50 mt-3 w-[560px] rounded-2xl border border-line bg-surface p-5 shadow-2xl shadow-black/10">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {shopCategories.map((category) => (
                      <Link
                        key={category}
                        href={`/shop?cat=${encodeURIComponent(category)}`}
                        className="rounded-xl border border-line bg-surface-2/70 px-3 py-2.5 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent"
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
          </nav>

          <div className="flex items-center gap-4 sm:gap-5">
            <Link href="/shop/wishlist" className="relative transition hover:text-accent" aria-label="Wishlist">
              <HeartIcon />
              {wishlistCount > 0 && <span className={badgeClass}>{wishlistCount}</span>}
            </Link>

            <Link href="/shop/cart" className="relative transition hover:text-accent" aria-label="Cart">
              <CartIcon />
              <span className={badgeClass}>{count}</span>
            </Link>

            {/* Profile — last item in the header */}
            <div className="relative" ref={accountRef}>
              <button
                type="button"
                onClick={() => setAccountOpen((s) => !s)}
                className={`flex items-center gap-2 transition hover:text-accent ${accountOpen ? "text-accent" : ""}`}
                aria-label="Profile"
              >
                {customer ? (
                  <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-brand-gradient text-sm font-extrabold">
                    {customer.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={customer.avatar}
                        alt={customer.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      customer.name.slice(0, 1).toUpperCase()
                    )}
                  </span>
                ) : (
                  <UserIcon />
                )}
              </button>
              {accountOpen && (
                <div className="absolute right-0 top-full z-50 mt-3 w-64 rounded-2xl border border-line bg-surface p-2.5 shadow-2xl shadow-black/10">
                  {customer ? (
                    <>
                      <div className="border-b border-line px-3 pb-3 pt-2">
                        <div className="truncate text-sm font-bold text-foreground">{customer.name}</div>
                        <div className="truncate text-xs text-muted">{customer.email}</div>
                      </div>
                      <div className="mt-2 space-y-0.5">
                        <Link href="/shop/account" onClick={() => setAccountOpen(false)} className={menuItemClass}>
                          <UserIcon /> My profile
                        </Link>
                        <Link href="/shop/wishlist" onClick={() => setAccountOpen(false)} className={menuItemClass}>
                          <HeartIcon size={17} /> Wishlist
                          {wishlistCount > 0 && (
                            <span className="ml-auto rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-bold text-accent">
                              {wishlistCount}
                            </span>
                          )}
                        </Link>
                        <button type="button" onClick={handleSignOut} className={`${menuItemClass} text-danger hover:text-danger`}>
                          <SignOutIcon /> Sign out
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-0.5 py-1">
                      <Link href="/shop/account" onClick={() => setAccountOpen(false)} className={menuItemClass}>
                        Sign in
                      </Link>
                      <Link href="/shop/account" onClick={() => setAccountOpen(false)} className={`${menuItemClass} text-muted`}>
                        Create account
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-line/60">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-6 py-3">
            <form onSubmit={handleSearch} className="relative flex h-11 flex-1 items-stretch overflow-visible rounded-lg border border-line bg-surface-2">
              <span className="flex items-center pl-4 text-muted">
                <SearchIcon />
              </span>
              <input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Search your favorite product..."
                className="min-w-0 flex-1 bg-transparent px-3 text-sm text-foreground placeholder:text-muted outline-none"
              />
              <button type="submit" className="rounded-r-lg bg-brand-gradient px-6 text-sm font-bold transition hover:brightness-110">
                Search
              </button>
              {suggestions.length > 0 && (
                <div className="absolute left-0 top-full z-40 mt-2 w-full rounded-xl border border-line bg-surface p-2 shadow-xl shadow-black/10">
                  {suggestions.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setTerm(p.name);
                        router.push(`/shop/products/${p.id}`);
                      }}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-foreground transition hover:bg-surface-2"
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
      </div>
    </header>
  );
}
