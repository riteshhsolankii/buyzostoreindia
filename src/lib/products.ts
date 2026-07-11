export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  emoji: string;
  image: string;
  createdAt: string;
};

export type ProductInput = Omit<Product, "id" | "createdAt">;

const seed: Product[] = [
  {
    id: "p-1",
    name: "Aurora Headphones",
    description:
      "Wireless over-ear headphones with active noise cancellation and 40-hour battery life.",
    price: 199.99,
    category: "Audio",
    stock: 24,
    emoji: "🎧",
    image: "/products/p-1.svg",
    createdAt: "2026-07-01T10:00:00.000Z",
  },
  {
    id: "p-2",
    name: "Nebula Mechanical Keyboard",
    description:
      "Hot-swappable 75% mechanical keyboard with RGB backlight and gasket mount.",
    price: 129.0,
    category: "Peripherals",
    stock: 41,
    emoji: "⌨️",
    image: "/products/p-2.svg",
    createdAt: "2026-07-02T10:00:00.000Z",
  },
  {
    id: "p-3",
    name: "Pulse Smartwatch",
    description:
      "Fitness tracking, heart-rate monitoring, and a bright AMOLED display in a slim case.",
    price: 249.5,
    category: "Wearables",
    stock: 12,
    emoji: "⌚",
    image: "/products/p-3.svg",
    createdAt: "2026-07-03T10:00:00.000Z",
  },
  {
    id: "p-4",
    name: "Orbit Wireless Mouse",
    description:
      "Ergonomic 8K-DPI wireless mouse with silent clicks and USB-C fast charging.",
    price: 59.99,
    category: "Peripherals",
    stock: 87,
    emoji: "🖱️",
    image: "/products/p-4.svg",
    createdAt: "2026-07-04T10:00:00.000Z",
  },
  {
    id: "p-5",
    name: "Lumen Desk Lamp",
    description:
      "Adjustable LED desk lamp with wireless charging pad and three color temperatures.",
    price: 79.0,
    category: "Home",
    stock: 5,
    emoji: "💡",
    image: "/products/p-5.svg",
    createdAt: "2026-07-05T10:00:00.000Z",
  },
  {
    id: "p-6",
    name: "Vertex 4K Monitor",
    description:
      "27-inch 4K IPS monitor with 144Hz refresh rate and 99% DCI-P3 color coverage.",
    price: 449.0,
    category: "Displays",
    stock: 0,
    emoji: "🖥️",
    image: "/products/p-6.svg",
    createdAt: "2026-07-06T10:00:00.000Z",
  },
];

export const FALLBACK_IMAGE = "/products/default.svg";

// Persist the store across Next.js dev-server hot reloads.
const globalStore = globalThis as unknown as { __buyzoProducts?: Product[] };

const seedImages = new Map(seed.map((p) => [p.id, p.image]));

function db(): Product[] {
  if (!globalStore.__buyzoProducts) {
    globalStore.__buyzoProducts = structuredClone(seed);
  }
  // Backfill products stored before the image field existed.
  for (const p of globalStore.__buyzoProducts) {
    if (!p.image) p.image = seedImages.get(p.id) ?? FALLBACK_IMAGE;
  }
  return globalStore.__buyzoProducts;
}

export function listProducts(): Product[] {
  return db();
}

export function getProduct(id: string): Product | undefined {
  return db().find((p) => p.id === id);
}

export function createProduct(input: ProductInput): Product {
  const product: Product = {
    ...input,
    id: `p-${crypto.randomUUID().slice(0, 8)}`,
    createdAt: new Date().toISOString(),
  };
  db().unshift(product);
  return product;
}

export function updateProduct(
  id: string,
  input: Partial<ProductInput>
): Product | undefined {
  const product = getProduct(id);
  if (!product) return undefined;
  Object.assign(product, input);
  return product;
}

export function deleteProduct(id: string): boolean {
  const products = db();
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) return false;
  products.splice(index, 1);
  return true;
}
