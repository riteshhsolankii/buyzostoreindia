// Shared data types + client-safe constants. Keep this module free of any
// Node.js imports — client components import values from here.

export type ProductStatus = "draft" | "active" | "out-of-stock" | "archived";

export type ProductVariant = {
  size: string;
  price: string;
  comparePrice: string;
  costPrice: string;
  stock: string;
  sku: string;
  weight: string;
  dimensions: string;
};

/** Extended catalog fields captured by the full admin product form. The shop
 * only renders the core Product fields; everything else is stored as-is. */
export type ProductExtras = {
  slug?: string;
  brand?: string;
  sku?: string;
  couponCode?: string;
  barcode?: string;
  status?: ProductStatus;
  subCategory?: string;
  collection?: string;
  tags?: string[];
  shortDescription?: string;
  fullDescription?: string;
  keyFeatures?: string;
  howToUse?: string;
  ingredients?: string;
  warnings?: string;
  fragrance?: {
    gender?: string;
    family?: string;
    topNotes?: string;
    heartNotes?: string;
    baseNotes?: string;
    concentration?: string;
    longevity?: string;
    sillage?: string;
    season?: string;
    occasion?: string;
  };
  variants?: ProductVariant[];
  gallery?: string[];
  hoverImage?: string;
  altText?: string;
  inventory?: {
    track?: boolean;
    lowStockAlert?: string;
    minOrder?: string;
    maxOrder?: string;
    backorder?: boolean;
    warehouse?: string;
  };
  shipping?: {
    weight?: string;
    length?: string;
    width?: string;
    height?: string;
    shippingClass?: string;
    freeShipping?: boolean;
  };
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    focusKeyword?: string;
    canonicalUrl?: string;
  };
  pricing?: {
    mrp?: string;
    discountType?: string;
    discountValue?: string;
    taxClass?: string;
    gst?: string;
  };
  visibility?: {
    featured?: boolean;
    bestseller?: boolean;
    newArrival?: boolean;
    limitedEdition?: boolean;
    recommended?: boolean;
    trending?: boolean;
    homepage?: boolean;
  };
  specifications?: {
    countryOfOrigin?: string;
    manufacturer?: string;
    shelfLife?: string;
    batchNumber?: string;
    mfgDate?: string;
    expiryDate?: string;
    alcoholPercent?: string;
  };
  reviews?: {
    enabled?: boolean;
    displayRating?: boolean;
    verifiedOnly?: boolean;
  };
  related?: {
    upsell?: string[];
    crossSell?: string[];
    boughtTogether?: string[];
  };
  scheduledAt?: string;
};

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
  extras?: ProductExtras;
};

export type ProductInput = Omit<Product, "id" | "createdAt">;

export const FALLBACK_IMAGE = "/products/default.svg";

/** Format a price in Indian Rupees, e.g. ₹1,29,000.00 */
export function formatINR(value: number, decimals = 2): string {
  return `₹${value.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  createdAt: string;
};

export type CustomerPublic = Omit<Customer, "passwordHash">;

export type SentEmail = {
  to: string;
  subject: string;
  text: string;
  sentAt: string;
  delivered: boolean;
};
