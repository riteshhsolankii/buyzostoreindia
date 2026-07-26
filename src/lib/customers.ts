import { all, one, run } from "./database";
import type { Address, Customer, CustomerPublic } from "./types";

export type { Address, Customer, CustomerPublic } from "./types";

const SECRET = "buyzo-customer-secret-v1";

export const CUSTOMER_COOKIE = "buyzo_customer_session";
export const CUSTOMER_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

type CustomerRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  password_hash: string;
  avatar: string | null;
  addresses_json: string | null;
  created_at: string;
};

function toCustomer(row: CustomerRow): Customer {
  const customer: Customer = {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
  };
  if (row.avatar) customer.avatar = row.avatar;
  if (row.addresses_json) {
    try {
      const parsed = JSON.parse(row.addresses_json);
      if (Array.isArray(parsed)) customer.addresses = parsed as Address[];
    } catch {
      // Ignore malformed address JSON — treat as no addresses.
    }
  }
  return customer;
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value)
  );
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function toPublic(customer: Customer): CustomerPublic {
  const { passwordHash: _passwordHash, ...rest } = customer;
  return rest;
}

const SELECT_CUSTOMER =
  "SELECT id, name, email, phone, password_hash, avatar, addresses_json, created_at FROM customers";

export async function listCustomers(): Promise<CustomerPublic[]> {
  const rows = await all<CustomerRow>(
    `${SELECT_CUSTOMER} ORDER BY created_at DESC`
  );
  return rows.map((row) => toPublic(toCustomer(row)));
}

export async function findCustomerByEmail(
  email: string
): Promise<Customer | undefined> {
  const row = await one<CustomerRow>(`${SELECT_CUSTOMER} WHERE email = ?`, [
    email.trim().toLowerCase(),
  ]);
  return row ? toCustomer(row) : undefined;
}

export async function getCustomer(id: string): Promise<Customer | undefined> {
  const row = await one<CustomerRow>(`${SELECT_CUSTOMER} WHERE id = ?`, [id]);
  return row ? toCustomer(row) : undefined;
}

export async function createCustomer(input: {
  name: string;
  email: string;
  phone: string;
  password: string;
}): Promise<Customer> {
  const now = new Date().toISOString();
  const customer: Customer = {
    id: `c-${crypto.randomUUID().slice(0, 8)}`,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    passwordHash: await sha256(`${input.password}:${SECRET}`),
    createdAt: now,
  };
  await run(
    `INSERT INTO customers (
       id, name, email, phone, password_hash, password_algorithm,
       avatar, addresses_json, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, 'legacy-sha256', NULL, NULL, ?, ?)`,
    [
      customer.id,
      customer.name,
      customer.email,
      customer.phone,
      customer.passwordHash,
      now,
      now,
    ]
  );
  return customer;
}

export async function updateCustomer(
  id: string,
  patch: Partial<Pick<Customer, "name" | "phone" | "avatar" | "addresses">>
): Promise<Customer | undefined> {
  const customer = await getCustomer(id);
  if (!customer) return undefined;

  if (patch.name !== undefined) customer.name = patch.name;
  if (patch.phone !== undefined) customer.phone = patch.phone;
  if (patch.avatar !== undefined) customer.avatar = patch.avatar || undefined;
  if (patch.addresses !== undefined) {
    // Exactly one default: first flagged one wins, else the first address.
    const firstDefault = patch.addresses.findIndex((a) => a.isDefault);
    customer.addresses = patch.addresses.map((a, i) => ({
      ...a,
      isDefault: i === (firstDefault === -1 ? 0 : firstDefault),
    }));
  }

  await run(
    `UPDATE customers SET
       name = ?, phone = ?, avatar = ?, addresses_json = ?, updated_at = ?
     WHERE id = ?`,
    [
      customer.name,
      customer.phone,
      customer.avatar || null,
      customer.addresses && customer.addresses.length > 0
        ? JSON.stringify(customer.addresses)
        : null,
      new Date().toISOString(),
      id,
    ]
  );
  return customer;
}

/** Phone is an optional profile field — stored digits-only, never verified. */
export function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, "");
}

export function isValidPhone(phone: string): boolean {
  return /^\+?\d{7,15}$/.test(normalizePhone(phone));
}

export function sanitizeAddress(raw: unknown): Address | null {
  if (!raw || typeof raw !== "object") return null;
  const a = raw as Record<string, unknown>;
  const str = (v: unknown, max: number) =>
    typeof v === "string" ? v.trim().slice(0, max) : "";
  const address: Address = {
    id: str(a.id, 40) || `addr-${crypto.randomUUID().slice(0, 8)}`,
    label: str(a.label, 30) || "Home",
    name: str(a.name, 80),
    phone: str(a.phone, 20),
    line1: str(a.line1, 120),
    line2: str(a.line2, 120) || undefined,
    city: str(a.city, 60),
    state: str(a.state, 60),
    pincode: str(a.pincode, 10),
    isDefault: Boolean(a.isDefault),
  };
  if (!address.name || !address.phone || !address.line1 || !address.city || !address.state || !address.pincode) {
    return null;
  }
  return address;
}

export async function verifyCustomer(
  email: string,
  password: string
): Promise<Customer | null> {
  const customer = await findCustomerByEmail(email);
  if (!customer) return null;
  const hash = await sha256(`${password}:${SECRET}`);
  return hash === customer.passwordHash ? customer : null;
}

// Signed session token: "<id>.<sig>" so the cookie can't be forged.
export async function customerToken(id: string): Promise<string> {
  return `${id}.${await sha256(`${id}:${SECRET}`)}`;
}

export async function customerFromToken(
  token: string | undefined
): Promise<Customer | null> {
  if (!token) return null;
  const [id, sig] = token.split(".");
  if (!id || !sig) return null;
  if (sig !== (await sha256(`${id}:${SECRET}`))) return null;
  return (await getCustomer(id)) ?? null;
}
