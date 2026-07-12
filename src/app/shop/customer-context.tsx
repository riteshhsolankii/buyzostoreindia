"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { CustomerPublic } from "@/lib/types";

type CustomerContextValue = {
  customer: CustomerPublic | null;
  checking: boolean;
  setCustomer: (customer: CustomerPublic | null) => void;
  signOut: () => Promise<void>;
};

const CustomerContext = createContext<CustomerContextValue | null>(null);

// Session lives in an httpOnly cookie, so the only reliable client-side
// check is asking the server — never localStorage.
export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<CustomerPublic | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch("/api/customers/me")
      .then(async (res) => {
        if (res.ok) setCustomer(await res.json());
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);

  const signOut = useCallback(async () => {
    await fetch("/api/customers/me", { method: "DELETE" }).catch(() => {});
    setCustomer(null);
  }, []);

  return (
    <CustomerContext.Provider value={{ customer, checking, setCustomer, signOut }}>
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomer() {
  const ctx = useContext(CustomerContext);
  if (!ctx) throw new Error("useCustomer must be used within CustomerProvider");
  return ctx;
}
