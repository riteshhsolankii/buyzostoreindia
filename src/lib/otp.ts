type OtpEntry = {
  code: string;
  expiresAt: number;
  verified: boolean;
  attempts: number;
};

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;

// Persist across dev-server hot reloads, same pattern as the other stores.
const globalStore = globalThis as unknown as {
  __buyzoOtps?: Map<string, OtpEntry>;
};

function store(): Map<string, OtpEntry> {
  if (!globalStore.__buyzoOtps) {
    globalStore.__buyzoOtps = new Map();
  }
  return globalStore.__buyzoOtps;
}

export function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, "");
}

export function isValidPhone(phone: string): boolean {
  return /^\+?\d{7,15}$/.test(normalizePhone(phone));
}

/** Generate and store a fresh OTP for this phone. Returns the code so the
 * caller can hand it to an SMS gateway (or surface it in demo mode). */
export function requestOtp(phone: string): string {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  store().set(normalizePhone(phone), {
    code,
    expiresAt: Date.now() + OTP_TTL_MS,
    verified: false,
    attempts: 0,
  });
  return code;
}

export type OtpResult = "ok" | "expired" | "invalid" | "too-many-attempts";

export function verifyOtp(phone: string, code: string): OtpResult {
  const entry = store().get(normalizePhone(phone));
  if (!entry || Date.now() > entry.expiresAt) return "expired";
  if (entry.attempts >= MAX_ATTEMPTS) return "too-many-attempts";
  entry.attempts += 1;
  if (entry.code !== code.trim()) return "invalid";
  entry.verified = true;
  return "ok";
}

export function isPhoneVerified(phone: string): boolean {
  const entry = store().get(normalizePhone(phone));
  return !!entry?.verified;
}

/** Drop the entry once registration succeeds so it can't be reused. */
export function consumeOtp(phone: string): void {
  store().delete(normalizePhone(phone));
}
