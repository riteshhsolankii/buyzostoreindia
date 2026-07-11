const SECRET = "buyzo-session-secret-v1";

export const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL ?? "riteshhsolankii@gmail.com";
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "Ritesh@!1101";

export const SESSION_COOKIE = "buyzo_admin_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// Stateless session token: SHA-256 of credentials + secret. Web Crypto is
// used so this works in both the Node.js and Edge (proxy) runtimes.
export async function getSessionToken(): Promise<string> {
  const data = new TextEncoder().encode(
    `${ADMIN_EMAIL}:${ADMIN_PASSWORD}:${SECRET}`
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
  return token === (await getSessionToken());
}
