"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="group flex items-center gap-2 text-left text-sm text-muted transition hover:text-danger"
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
        className="transition-transform duration-200 group-hover:-translate-x-0.5"
      >
        <path d="M14 6V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M9 12h11m0 0-3.5-3.5M20 12l-3.5 3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Log out
    </button>
  );
}
