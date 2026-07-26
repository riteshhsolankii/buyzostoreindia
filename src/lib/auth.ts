export const SESSION_COOKIE = "buyzo_admin_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/**
 * Admin credentials come from the environment only — there is no built-in
 * fallback, so a missing variable fails loudly instead of shipping a public
 * default password. Read lazily so importing SESSION_COOKIE stays side-effect
 * free (src/proxy.ts does exactly that on the Edge runtime).
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set. Add it to .env.local (or Vercel).`);
  }
  return value;
}

export function adminEmail(): string {
  return requireEnv("ADMIN_EMAIL");
}

// Stateless session token: SHA-256 of credentials + secret. Web Crypto is
// used so this works in both the Node.js and Edge (proxy) runtimes.
export async function getSessionToken(): Promise<string> {
  const secret = process.env.SESSION_SECRET ?? "buyzo-session-secret-v1";
  const data = new TextEncoder().encode(
    `${adminEmail()}:${requireEnv("ADMIN_PASSWORD")}:${secret}`
  );
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function isValidSession(
  token: string | undefined
): Promise<boolean> {
  if (!token) return false;
  try {
    return token === (await getSessionToken());
  } catch (error) {
    // Missing credentials mean nobody can be authenticated. Answering "not
    // signed in" keeps every guarded route returning 401 instead of 500; the
    // log is what tells the operator the server is misconfigured.
    console.error("[buyzo-auth] cannot validate sessions:", error);
    return false;
  }
}

/** Credential check for the admin login route. */
export function isAdminCredentials(
  email: string | undefined,
  password: string | undefined
): boolean {
  if (!email || !password) return false;
  return (
    email.trim().toLowerCase() === adminEmail().toLowerCase() &&
    password === requireEnv("ADMIN_PASSWORD")
  );
}
