const SECRET = "buyzo-customer-secret-v1";

export const CUSTOMER_COOKIE = "buyzo_customer_session";
export const CUSTOMER_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  createdAt: string;
};

export type CustomerPublic = Omit<Customer, "passwordHash">;

// Persist the store across Next.js dev-server hot reloads.
const globalStore = globalThis as unknown as { __buyzoCustomers?: Customer[] };

function db(): Customer[] {
  if (!globalStore.__buyzoCustomers) {
    globalStore.__buyzoCustomers = [];
  }
  return globalStore.__buyzoCustomers;
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

export function listCustomers(): CustomerPublic[] {
  return db().map(toPublic);
}

export function findCustomerByEmail(email: string): Customer | undefined {
  return db().find((c) => c.email === email.trim().toLowerCase());
}

export function getCustomer(id: string): Customer | undefined {
  return db().find((c) => c.id === id);
}

export async function createCustomer(input: {
  name: string;
  email: string;
  phone: string;
  password: string;
}): Promise<Customer> {
  const customer: Customer = {
    id: `c-${crypto.randomUUID().slice(0, 8)}`,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    passwordHash: await sha256(`${input.password}:${SECRET}`),
    createdAt: new Date().toISOString(),
  };
  db().unshift(customer);
  return customer;
}

export async function verifyCustomer(
  email: string,
  password: string
): Promise<Customer | null> {
  const customer = findCustomerByEmail(email);
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
  return getCustomer(id) ?? null;
}
