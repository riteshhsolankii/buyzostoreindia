"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CustomerPublic } from "@/lib/customers";
import { BuyzoMark } from "../site-header";

type Mode = "signin" | "register";

const inputClass =
  "mt-1 w-full rounded-lg border border-line bg-surface-2 px-3.5 py-2.5 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20";

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  ) : (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 4l16 16M10 10.6a3 3 0 0 0 4.2 4.2M7.4 7.5C4.4 9.2 2.5 12 2.5 12S6 18.5 12 18.5c1.7 0 3.2-.5 4.5-1.2M10 5.7c.6-.13 1.3-.2 2-.2 6 0 9.5 6.5 9.5 6.5s-.9 1.6-2.5 3.2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold transition-colors duration-200 ${
        ok ? "bg-accent text-black" : "bg-surface-2 text-muted"
      }`}
    >
      ✓
    </span>
  );
}

export default function AccountPage() {
  const [customer, setCustomer] = useState<CustomerPublic | null>(null);
  const [checking, setChecking] = useState(true);
  const [mode, setMode] = useState<Mode>("register");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [welcome, setWelcome] = useState(false);
  const [emailSent, setEmailSent] = useState<boolean | null>(null);

  // OTP state
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    fetch("/api/customers/me")
      .then(async (res) => {
        if (res.ok) setCustomer(await res.json());
      })
      .finally(() => setChecking(false));
  }, []);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  function field(key: keyof typeof form) {
    return {
      value: form[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setForm((f) => ({ ...f, [key]: value }));
        if (key === "phone") {
          // New number → previous verification no longer counts.
          setOtpSent(false);
          setOtpVerified(false);
          setOtpCode("");
          setOtpError(null);
          setDemoCode(null);
        }
      },
    };
  }

  const phoneDigits = form.phone.replace(/[^\d]/g, "");
  const phoneLooksValid = phoneDigits.length >= 7 && phoneDigits.length <= 15;

  const pwChecks = [
    { label: "8+ characters", ok: form.password.length >= 8 },
    { label: "Uppercase (A-Z)", ok: /[A-Z]/.test(form.password) },
    { label: "Lowercase (a-z)", ok: /[a-z]/.test(form.password) },
    { label: "Number (0-9)", ok: /\d/.test(form.password) },
    { label: "Special (!@#$…)", ok: /[^A-Za-z0-9]/.test(form.password) },
  ];
  const pwOk = pwChecks.every((c) => c.ok);
  const confirmOk = confirm.length > 0 && confirm === form.password;
  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim());

  const canRegister =
    form.name.trim().length > 1 &&
    emailOk &&
    pwOk &&
    confirmOk &&
    (form.phone.trim() === "" || otpVerified);

  async function handleSendOtp() {
    setOtpBusy(true);
    setOtpError(null);
    const res = await fetch("/api/customers/otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: form.phone }),
    });
    const data = await res.json().catch(() => null);
    setOtpBusy(false);
    if (!res.ok) {
      setOtpError(data?.error ?? "Could not send OTP. Try again.");
      return;
    }
    setOtpSent(true);
    setOtpCode("");
    setDemoCode(data?.demoCode ?? null);
    setResendIn(30);
  }

  async function handleVerifyOtp() {
    setOtpBusy(true);
    setOtpError(null);
    const res = await fetch("/api/customers/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: form.phone, code: otpCode }),
    });
    const data = await res.json().catch(() => null);
    setOtpBusy(false);
    if (!res.ok) {
      setOtpError(data?.error ?? "Verification failed. Try again.");
      return;
    }
    setOtpVerified(true);
    setDemoCode(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res =
      mode === "register"
        ? await fetch("/api/customers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
          })
        : await fetch("/api/customers/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: form.email, password: form.password }),
          });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Something went wrong. Please try again.");
      return;
    }
    const data = await res.json();
    setCustomer(data);
    setWelcome(mode === "register");
    setEmailSent(mode === "register" ? Boolean(data.emailSent) : null);
  }

  async function handleLogout() {
    await fetch("/api/customers/me", { method: "DELETE" });
    setCustomer(null);
    setWelcome(false);
    setEmailSent(null);
    setForm({ name: "", email: "", phone: "", password: "" });
    setConfirm("");
    setOtpSent(false);
    setOtpVerified(false);
    setOtpCode("");
    setDemoCode(null);
  }

  return (
    <main className="relative flex min-h-screen flex-1 items-center justify-center overflow-hidden px-6 py-16">
      {/* Background: logo colors */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-accent/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-48 -right-32 h-96 w-96 rounded-full bg-accent-2/10 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

      {/* Back to shop */}
      <Link
        href="/shop"
        className="group absolute left-6 top-6 flex items-center gap-2 text-sm text-muted transition hover:text-accent"
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          className="transition-transform duration-200 group-hover:-translate-x-0.5"
        >
          <path d="M20 12H5m0 0 6-6m-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to shop
      </Link>

      {checking ? (
        <div className="h-96 w-full max-w-md animate-pulse rounded-3xl border border-line bg-surface" />
      ) : customer ? (
        /* ---------- Signed-in view ---------- */
        <div className="animate-scale-in w-full max-w-lg overflow-hidden rounded-3xl border border-line bg-surface/80 shadow-2xl shadow-black/60 backdrop-blur">
          <div className="bg-brand-gradient px-8 py-6 text-black">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-black text-xl font-extrabold text-accent">
                {customer.name.slice(0, 1).toUpperCase()}
              </span>
              <div>
                <div className="text-lg font-extrabold leading-tight">
                  {welcome ? `Welcome, ${customer.name}! 🎉` : customer.name}
                </div>
                <div className="text-sm font-medium text-black/70">
                  Buyzo Member
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-4 px-8 py-6">
            {welcome && emailSent !== null && (
              <div className="animate-fade-in rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm">
                {emailSent ? (
                  <>📧 A welcome email is on its way to <b>{customer.email}</b>.</>
                ) : (
                  <>
                    📧 Welcome email created (demo mode — check the server
                    console). Add <code className="text-accent">RESEND_API_KEY</code>{" "}
                    to .env.local for real delivery.
                  </>
                )}
              </div>
            )}
            <div className="animate-fade-up flex justify-between border-b border-line pb-3 text-sm" style={{ animationDelay: "60ms" }}>
              <span className="text-muted">Email</span>
              <span className="font-medium">{customer.email}</span>
            </div>
            <div className="animate-fade-up flex justify-between border-b border-line pb-3 text-sm" style={{ animationDelay: "120ms" }}>
              <span className="text-muted">Phone</span>
              <span className="font-medium">
                {customer.phone ? (
                  <>
                    {customer.phone}{" "}
                    <span className="ml-1 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent">
                      VERIFIED
                    </span>
                  </>
                ) : (
                  "—"
                )}
              </span>
            </div>
            <div className="animate-fade-up flex justify-between text-sm" style={{ animationDelay: "180ms" }}>
              <span className="text-muted">Member since</span>
              <span className="font-medium">
                {new Date(customer.createdAt).toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="flex gap-3 pt-2">
              <Link
                href="/shop"
                className="flex-1 rounded-lg bg-brand-gradient px-4 py-2.5 text-center text-sm font-bold text-black shadow-lg shadow-accent/20 transition hover:brightness-110"
              >
                Continue shopping
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-lg border border-line px-4 py-2.5 text-sm text-muted transition hover:border-danger/50 hover:text-danger"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ---------- Auth view ---------- */
        <div className="w-full max-w-md">
          <div className="animate-fade-up mb-8 text-center">
            <div className="mb-3 inline-block">
              <BuyzoMark size={60} />
            </div>
            <h1 className="text-2xl font-extrabold">
              {mode === "register" ? (
                <>
                  Join <span className="text-white">Buy</span>
                  <span className="text-brand-gradient">zo</span> today
                </>
              ) : (
                "Welcome back"
              )}
            </h1>
            <p className="text-muted mt-1 text-sm">
              Shop More. Pay Less. Live Better.
            </p>
          </div>

          <div
            className="animate-fade-up rounded-3xl border border-line bg-surface/80 p-6 shadow-2xl shadow-black/60 backdrop-blur sm:p-8"
            style={{ animationDelay: "100ms" }}
          >
            {/* Tabs */}
            <div className="mb-6 grid grid-cols-2 rounded-lg bg-surface-2 p-1 text-sm font-semibold">
              {(["register", "signin"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMode(m);
                    setError(null);
                  }}
                  className={`rounded-md py-2 transition-all duration-200 ${
                    mode === m
                      ? "bg-brand-gradient text-black shadow"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {m === "register" ? "Create account" : "Sign in"}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <label className="animate-fade-up block">
                  <span className="text-sm font-medium text-muted">Full name *</span>
                  <input
                    {...field("name")}
                    required
                    className={inputClass}
                    placeholder="Enter your full name"
                  />
                </label>
              )}

              <label className="block">
                <span className="text-sm font-medium text-muted">Email *</span>
                <input
                  {...field("email")}
                  type="email"
                  required
                  autoComplete="email"
                  className={inputClass}
                  placeholder="Enter your email address"
                />
              </label>

              {/* Phone + OTP */}
              {mode === "register" && (
                <div className="animate-fade-up">
                  <span className="text-sm font-medium text-muted">Phone</span>
                  <div className="mt-1 flex gap-2">
                    <input
                      {...field("phone")}
                      type="tel"
                      disabled={otpVerified}
                      className={`${inputClass} mt-0 flex-1 disabled:opacity-70`}
                      placeholder="Enter your phone number"
                    />
                    {otpVerified ? (
                      <span className="flex items-center gap-1.5 rounded-lg bg-accent/15 px-3 text-xs font-bold text-accent">
                        <CheckDot ok /> Verified
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={!phoneLooksValid || otpBusy || resendIn > 0}
                        className="shrink-0 rounded-lg border border-accent/40 px-3.5 text-xs font-bold text-accent transition hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {otpBusy && !otpSent
                          ? "Sending…"
                          : resendIn > 0
                            ? `Resend in ${resendIn}s`
                            : otpSent
                              ? "Resend OTP"
                              : "Send OTP"}
                      </button>
                    )}
                  </div>

                  {otpSent && !otpVerified && (
                    <div className="animate-fade-up mt-2 rounded-lg border border-line bg-surface-2/60 p-3">
                      {demoCode && (
                        <p className="mb-2 rounded-md bg-accent/10 px-2.5 py-1.5 text-[11px] text-accent">
                          Demo mode (no SMS gateway): your OTP is{" "}
                          <b className="tracking-widest">{demoCode}</b>
                        </p>
                      )}
                      <div className="flex gap-2">
                        <input
                          value={otpCode}
                          onChange={(e) =>
                            setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                          }
                          inputMode="numeric"
                          className={`${inputClass} mt-0 flex-1 text-center tracking-[0.4em]`}
                          placeholder="Enter 6-digit OTP"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyOtp}
                          disabled={otpCode.length !== 6 || otpBusy}
                          className="shrink-0 rounded-lg bg-brand-gradient px-4 text-xs font-bold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {otpBusy ? "Checking…" : "Verify"}
                        </button>
                      </div>
                    </div>
                  )}
                  {otpError && (
                    <p className="animate-fade-in mt-1.5 text-xs text-danger">{otpError}</p>
                  )}
                </div>
              )}

              {/* Password */}
              <label className="block">
                <span className="text-sm font-medium text-muted">Password *</span>
                <div className="relative">
                  <input
                    {...field("password")}
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete={mode === "register" ? "new-password" : "current-password"}
                    className={`${inputClass} pr-11`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition hover:text-accent"
                  >
                    <EyeIcon open={!showPassword} />
                  </button>
                </div>
              </label>

              {/* Live password rules */}
              {mode === "register" && form.password.length > 0 && (
                <div className="animate-fade-up grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-lg border border-line bg-surface-2/60 p-3 text-xs">
                  {pwChecks.map((c) => (
                    <span
                      key={c.label}
                      className={`flex items-center gap-2 transition-colors duration-200 ${
                        c.ok ? "text-foreground" : "text-muted"
                      }`}
                    >
                      <CheckDot ok={c.ok} /> {c.label}
                    </span>
                  ))}
                </div>
              )}

              {/* Confirm password */}
              {mode === "register" && (
                <label className="animate-fade-up block">
                  <span className="text-sm font-medium text-muted">Confirm password *</span>
                  <div className="relative">
                    <input
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      type={showConfirm ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      className={`${inputClass} pr-11 ${
                        confirm.length > 0 && !confirmOk ? "border-danger/60" : ""
                      }`}
                      placeholder="Re-enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((s) => !s)}
                      aria-label={showConfirm ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition hover:text-accent"
                    >
                      <EyeIcon open={!showConfirm} />
                    </button>
                  </div>
                  {confirm.length > 0 && (
                    <span
                      className={`mt-1 block text-xs ${
                        confirmOk ? "text-accent" : "text-danger"
                      }`}
                    >
                      {confirmOk ? "✓ Passwords match" : "Passwords do not match"}
                    </span>
                  )}
                </label>
              )}

              {error && (
                <p className="animate-fade-in text-sm text-danger">{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting || (mode === "register" && !canRegister)}
                className="w-full rounded-lg bg-brand-gradient px-4 py-3 text-sm font-extrabold text-black shadow-lg shadow-accent/25 transition hover:shadow-accent/40 hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting
                  ? "Please wait…"
                  : mode === "register"
                    ? "Create my account"
                    : "Sign in"}
              </button>
            </form>

            <p className="text-muted mt-4 text-center text-xs">
              {mode === "register" ? (
                <>
                  Already a member?{" "}
                  <button
                    onClick={() => setMode("signin")}
                    className="font-semibold text-accent hover:underline"
                  >
                    Sign in
                  </button>
                </>
              ) : (
                <>
                  New to Buyzo?{" "}
                  <button
                    onClick={() => setMode("register")}
                    className="font-semibold text-accent hover:underline"
                  >
                    Create an account
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
