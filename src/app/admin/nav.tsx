"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function DashboardIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3.5" y="3.5" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3 20 7.5v9L12 21l-8-4.5v-9L12 3z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M4 7.5 12 12l8-4.5M12 12v9" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="9" cy="8.5" r="3" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3.5 19c.6-3 2.7-4.5 5.5-4.5s4.9 1.5 5.5 4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="16.5" cy="9.5" r="2.4" stroke="currentColor" strokeWidth="1.7" />
      <path d="M17 14.6c2 .4 3.2 1.7 3.6 3.9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 8h12l-1 11a2 2 0 0 1-2 1.8H9A2 2 0 0 1 7 19L6 8z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M9 8V6.5a3 3 0 0 1 6 0V8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3.5 11V5a1.5 1.5 0 0 1 1.5-1.5h6l9.3 9.3a1.5 1.5 0 0 1 0 2.1l-6 6a1.5 1.5 0 0 1-2.1 0L3.5 11z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle cx="8.5" cy="8.5" r="1.4" fill="currentColor" />
    </svg>
  );
}

const links = [
  { href: "/admin", label: "Dashboard", icon: DashboardIcon },
  { href: "/admin/orders", label: "Orders", icon: BagIcon },
  { href: "/admin/products", label: "Products", icon: BoxIcon },
  { href: "/admin/categories", label: "Categories", icon: TagIcon },
  { href: "/admin/coupons/create", label: "Coupon Create", icon: TagIcon },
  { href: "/admin/customers", label: "Customers", icon: UsersIcon },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 p-3">
      {links.map((link, i) => {
        const active = pathname === link.href;
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`animate-slide-in group relative flex items-center gap-3 overflow-hidden rounded-lg px-3 py-2.5 text-sm transition-all duration-200 ${
              active
                ? "bg-accent/12 font-semibold text-accent"
                : "text-muted hover:bg-surface-2 hover:text-foreground"
            }`}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <span
              className={`absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-brand-gradient transition-all duration-300 ${
                active ? "opacity-100" : "opacity-0 -translate-x-1"
              }`}
            />
            <span className="transition-transform duration-200 group-hover:scale-110">
              <Icon />
            </span>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
