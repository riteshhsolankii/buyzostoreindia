import { one, run } from "./database";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes — email is slower than SMS
const RESEND_COOLDOWN_MS = 30 * 1000;
const MAX_ATTEMPTS = 5;

/**
 * Codes are stored hashed. The salt is a constant rather than per-row because a
 * six-digit code has only a million possibilities — a per-row salt would not
 * make it meaningfully harder to brute force offline. What this does buy us is
 * that a leaked row cannot be replayed directly, and the attempt counter plus
 * the ten-minute expiry are what actually bound online guessing.
 */
const CODE_SALT = process.env.OTP_SECRET ?? "buyzo-otp-secret-v1";

type OtpRow = {
  code_hash: string;
  attempts: number;
  verified: number;
  sent_at: string;
  expires_at: string;
};

export function normalizeTarget(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalizeTarget(email));
}

async function hashCode(target: string, code: string): Promise<string> {
  const data = new TextEncoder().encode(`${target}:${code}:${CODE_SALT}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateCode(): string {
  // crypto.getRandomValues rather than Math.random: this is a credential.
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  return String(100000 + (buffer[0] % 900000));
}

export type RequestOtpResult =
  | { ok: true; code: string; expiresInSeconds: number }
  | { ok: false; reason: "too-soon"; retryInSeconds: number };

/**
 * Issue a fresh code for this address, replacing any previous one. Returns the
 * plain code so the caller can mail it — it must never reach the client.
 */
export async function requestOtp(email: string): Promise<RequestOtpResult> {
  const target = normalizeTarget(email);
  const now = Date.now();

  const existing = await one<Pick<OtpRow, "sent_at">>(
    "SELECT sent_at FROM otp_codes WHERE target = ?",
    [target]
  );
  if (existing) {
    const elapsed = now - new Date(existing.sent_at).getTime();
    if (elapsed >= 0 && elapsed < RESEND_COOLDOWN_MS) {
      return {
        ok: false,
        reason: "too-soon",
        retryInSeconds: Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000),
      };
    }
  }

  const code = generateCode();
  await run(
    `INSERT INTO otp_codes (target, code_hash, attempts, verified, sent_at, expires_at)
     VALUES (@target, @codeHash, 0, 0, @sentAt, @expiresAt)
     ON CONFLICT(target) DO UPDATE SET
       code_hash = excluded.code_hash,
       attempts = 0,
       verified = 0,
       sent_at = excluded.sent_at,
       expires_at = excluded.expires_at`,
    {
      target,
      codeHash: await hashCode(target, code),
      sentAt: new Date(now).toISOString(),
      expiresAt: new Date(now + OTP_TTL_MS).toISOString(),
    }
  );

  return { ok: true, code, expiresInSeconds: Math.floor(OTP_TTL_MS / 1000) };
}

export type OtpResult = "ok" | "expired" | "invalid" | "too-many-attempts";

export async function verifyOtp(
  email: string,
  code: string
): Promise<OtpResult> {
  const target = normalizeTarget(email);
  const row = await one<OtpRow>(
    "SELECT code_hash, attempts, verified, sent_at, expires_at FROM otp_codes WHERE target = ?",
    [target]
  );
  if (!row || Date.now() > new Date(row.expires_at).getTime()) return "expired";
  if (row.attempts >= MAX_ATTEMPTS) return "too-many-attempts";

  // Count the attempt before comparing, so a crash mid-verify cannot be used to
  // retry for free.
  await run("UPDATE otp_codes SET attempts = attempts + 1 WHERE target = ?", [
    target,
  ]);

  if (row.code_hash !== (await hashCode(target, code.trim()))) return "invalid";

  await run("UPDATE otp_codes SET verified = 1 WHERE target = ?", [target]);
  return "ok";
}

/** True only while a verified, unexpired code exists for this address. */
export async function isTargetVerified(email: string): Promise<boolean> {
  const target = normalizeTarget(email);
  const row = await one<Pick<OtpRow, "verified" | "expires_at">>(
    "SELECT verified, expires_at FROM otp_codes WHERE target = ?",
    [target]
  );
  if (!row) return false;
  if (Date.now() > new Date(row.expires_at).getTime()) return false;
  return row.verified === 1;
}

/** Drop the entry once registration succeeds so it can't be reused. */
export async function consumeOtp(email: string): Promise<void> {
  await run("DELETE FROM otp_codes WHERE target = ?", [normalizeTarget(email)]);
}

/**
 * Delete codes that expired a while ago. Called opportunistically when a new
 * code is requested, which is often enough for a table this small.
 */
export async function pruneExpiredOtps(): Promise<void> {
  await run("DELETE FROM otp_codes WHERE expires_at < ?", [
    new Date(Date.now() - OTP_TTL_MS).toISOString(),
  ]);
}
