"use client";

import Image from "next/image";
import Link from "next/link";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Product, ProductVariant } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Shared styles                                                      */
/* ------------------------------------------------------------------ */

const controlClass =
  "w-full rounded-lg border border-line bg-surface-2 px-3.5 py-2.5 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20";

/* ------------------------------------------------------------------ */
/*  Reusable controls                                                  */
/* ------------------------------------------------------------------ */

function Field({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="block">
      <span className="mb-1 block text-sm font-medium text-muted">
        {label} {required && <span className="text-accent">*</span>}
      </span>
      {children}
      {hint && !error && (
        <span className="mt-1 block text-[11px] text-muted">{hint}</span>
      )}
      {error && (
        <span className="animate-fade-in mt-1 block text-xs text-danger">
          {error}
        </span>
      )}
    </div>
  );
}

/** Custom dropdown — replaces the ugly native <select>. */
function Select({
  value,
  onChange,
  options,
  placeholder = "Select…",
  createLabel,
  onCreate,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  createLabel?: string;
  onCreate?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className={`${controlClass} flex items-center justify-between gap-2 text-left ${
          open ? "border-accent ring-2 ring-accent/20" : ""
        }`}
      >
        <span className={`truncate ${selected ? "" : "text-muted"}`}>
          {selected?.label ?? placeholder}
        </span>
        <svg
          width="11"
          height="11"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden
          className={`shrink-0 text-muted transition-transform duration-200 ${
            open ? "rotate-180 text-accent" : ""
          }`}
        >
          <path
            d="M2.5 4.5 6 8l3.5-3.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div className="animate-scale-in absolute z-30 mt-1.5 w-full overflow-hidden rounded-xl border border-line bg-surface shadow-2xl shadow-black/15">
          <div className="max-h-52 overflow-y-auto p-1.5">
            {options.length === 0 && (
              <p className="px-3 py-2.5 text-xs text-muted">Nothing here yet</p>
            )}
            {options.map((o) => {
              const active = o.value === value;
              return (
                <button
                  type="button"
                  key={o.value}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                    active
                      ? "bg-accent/12 font-semibold text-accent"
                      : "text-foreground hover:bg-surface-2"
                  }`}
                >
                  <span className="truncate">{o.label}</span>
                  {active && (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path
                        d="m5 12.5 4.5 4.5L19 7.5"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
          {createLabel && onCreate && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onCreate();
              }}
              className="flex w-full items-center gap-2 border-t border-line px-4 py-2.5 text-left text-sm font-semibold text-accent transition hover:bg-accent/10"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
                +
              </span>
              {createLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** Tag / multi-value chip input. */
function ChipsInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  function add() {
    const t = draft.trim().replace(/,+$/, "");
    if (t && !value.includes(t)) onChange([...value, t]);
    setDraft("");
  }

  return (
    <div className={`${controlClass} flex min-h-11 flex-wrap items-center gap-1.5 py-1.5`}>
      {value.map((t) => (
        <span
          key={t}
          className="animate-scale-in flex items-center gap-1.5 rounded-full bg-accent/15 px-2.5 py-1 text-xs font-semibold text-accent"
        >
          {t}
          <button
            type="button"
            onClick={() => onChange(value.filter((x) => x !== t))}
            className="text-accent/70 transition hover:text-danger"
            aria-label={`Remove ${t}`}
          >
            ✕
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add();
          } else if (e.key === "Backspace" && draft === "" && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={add}
        className="min-w-28 flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
        placeholder={value.length === 0 ? placeholder : "Add more…"}
      />
    </div>
  );
}

/** Switch-style toggle row. */
function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3.5 py-2.5 text-left transition ${
        checked ? "border-accent/40 bg-accent/5" : "border-line bg-surface-2/50"
      }`}
    >
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="text-[11px] text-muted">{hint}</span>}
      </span>
      <span
        className={`relative h-5 w-9.5 shrink-0 rounded-full transition-colors duration-200 ${
          checked ? "bg-accent" : "bg-line"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full transition-all duration-200 ${
            checked ? "left-5 bg-white" : "left-0.5 bg-white/70"
          }`}
        />
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Image helpers                                                      */
/* ------------------------------------------------------------------ */

function readImageFile(
  file: File,
  onOk: (dataUrl: string) => void,
  onErr: (msg: string) => void
) {
  if (!file.type.startsWith("image/")) {
    onErr("Please choose an image file (PNG, JPG, SVG…).");
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    onErr("Each image must be under 2 MB.");
    return;
  }
  const reader = new FileReader();
  reader.onload = () => onOk(String(reader.result));
  reader.readAsDataURL(file);
}

/** Single-image drag & drop upload box. */
function UploadBox({
  image,
  onImage,
  onError,
  emptyLabel,
  heightClass = "h-36",
}: {
  image: string;
  onImage: (v: string) => void;
  onError: (msg: string) => void;
  emptyLabel: string;
  heightClass?: string;
}) {
  const [dragging, setDragging] = useState(false);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (file) readImageFile(file, onImage, onError);
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={`relative ${heightClass} overflow-hidden rounded-xl border-2 border-dashed transition ${
        dragging ? "border-accent bg-accent/10" : "border-line bg-surface-2/50"
      }`}
    >
      {image ? (
        <>
          <Image src={image} alt="" fill unoptimized className="object-cover" />
          <div className="absolute inset-0 flex items-end justify-end gap-2 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 transition hover:opacity-100">
            <label className="cursor-pointer rounded-md bg-accent px-2.5 py-1 text-[11px] font-bold text-white">
              Change
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  handleFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
            <button
              type="button"
              onClick={() => onImage("")}
              className="rounded-md bg-black/70 px-2.5 py-1 text-[11px] font-bold text-white transition hover:bg-danger"
            >
              Remove
            </button>
          </div>
        </>
      ) : (
        <label className="flex h-full cursor-pointer flex-col items-center justify-center gap-1.5 text-center">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-lg text-accent">
            +
          </span>
          <span className="text-xs font-semibold">{emptyLabel}</span>
          <span className="text-[10px] text-muted">
            Drag &amp; drop or click — max 2 MB
          </span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      )}
    </div>
  );
}

/** Multi-image gallery upload. */
function GalleryUpload({
  images,
  onImages,
  onError,
}: {
  images: string[];
  onImages: (v: string[]) => void;
  onError: (msg: string) => void;
}) {
  function addFiles(files: FileList | null) {
    if (!files) return;
    Array.from(files)
      .slice(0, 6 - images.length)
      .forEach((file) =>
        readImageFile(file, (url) => onImages([...images, url]), onError)
      );
  }

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
      {images.map((img, i) => (
        <div
          key={i}
          className="animate-scale-in group relative h-24 overflow-hidden rounded-lg border border-line bg-surface-2"
        >
          <Image src={img} alt="" fill unoptimized className="object-cover" />
          <button
            type="button"
            onClick={() => onImages(images.filter((_, x) => x !== i))}
            className="absolute right-1 top-1 rounded-full bg-black/70 px-1.5 text-[11px] text-white opacity-0 transition group-hover:opacity-100 hover:bg-danger"
          >
            ✕
          </button>
        </div>
      ))}
      {images.length < 6 && (
        <label
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            addFiles(e.dataTransfer.files);
          }}
          className="flex h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-line text-muted transition hover:border-accent hover:text-accent"
        >
          <span className="text-lg">+</span>
          <span className="text-[10px] font-semibold">Add ({images.length}/6)</span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      )}
    </div>
  );
}

/** Minimal rich-text editor (bold / italic / underline / lists). */
function RichText({
  initial,
  onChange,
}: {
  initial: string;
  onChange: (html: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const tools: [string, string][] = [
    ["bold", "B"],
    ["italic", "I"],
    ["underline", "U"],
    ["insertUnorderedList", "• List"],
    ["insertOrderedList", "1. List"],
  ];

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface-2 transition focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
      <div className="flex gap-1 border-b border-line p-1.5">
        {tools.map(([cmd, label]) => (
          <button
            type="button"
            key={cmd}
            onMouseDown={(e) => {
              e.preventDefault();
              document.execCommand(cmd);
              onChange(ref.current?.innerHTML ?? "");
            }}
            className="rounded px-2 py-1 text-xs font-bold text-muted transition hover:bg-accent/10 hover:text-accent"
          >
            {label}
          </button>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={() => onChange(ref.current?.innerHTML ?? "")}
        dangerouslySetInnerHTML={{ __html: initial }}
        className="min-h-28 px-3.5 py-2.5 text-sm outline-none [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
      />
    </div>
  );
}

/** Which tab is open — SectionCards render only when their tab is active. */
const ActiveTabContext = createContext("basic");

function SectionCard({
  id,
  title,
  subtitle,
  children,
}: {
  id: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const activeTab = useContext(ActiveTabContext);
  if (activeTab !== id) return null;
  return (
    <section
      id={id}
      className="animate-fade-up rounded-2xl border border-line bg-surface p-6"
    >
      <h2 className="text-base font-bold">{title}</h2>
      {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  The form                                                           */
/* ------------------------------------------------------------------ */

const SECTIONS = [
  { id: "basic", label: "Basic Info" },
  { id: "category", label: "Category" },
  { id: "description", label: "Description" },
  { id: "variants", label: "Variants" },
  { id: "images", label: "Images" },
  { id: "inventory", label: "Inventory" },
  { id: "shipping", label: "Shipping" },
  { id: "seo", label: "SEO" },
  { id: "pricing", label: "Pricing" },
  { id: "visibility", label: "Visibility" },
  { id: "specs", label: "Specifications" },
  { id: "reviews", label: "Reviews" },
  { id: "related", label: "Related" },
  { id: "publish", label: "Publish" },
];

const emptyVariant: ProductVariant = {
  size: "",
  price: "",
  comparePrice: "",
  costPrice: "",
  stock: "",
  sku: "",
  weight: "",
  dimensions: "",
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function ProductForm({ initial }: { initial?: Product }) {
  const router = useRouter();
  const x = initial?.extras;

  const [f, setF] = useState({
    // basic
    name: initial?.name ?? "",
    slug: x?.slug ?? (initial ? slugify(initial.name) : ""),
    brand: x?.brand ?? "",
    sku: x?.sku ?? "",
    couponCode: x?.couponCode ?? "",
    status: x?.status ?? "active",
    // category
    category: initial?.category ?? "",
    subCategory: x?.subCategory ?? "",
    collection: x?.collection ?? "",
    tags: x?.tags ?? ([] as string[]),
    // description
    shortDescription: x?.shortDescription ?? initial?.description ?? "",
    fullDescription: x?.fullDescription ?? "",
    keyFeatures: x?.keyFeatures ?? "",
    howToUse: x?.howToUse ?? "",
    ingredients: x?.ingredients ?? "",
    warnings: x?.warnings ?? "",
    // images
    image: initial?.image ?? "",
    gallery: x?.gallery ?? ([] as string[]),
    hoverImage: x?.hoverImage ?? "",
    altText: x?.altText ?? "",
    // inventory
    track: x?.inventory?.track ?? true,
    stock: initial ? String(initial.stock) : "0",
    lowStockAlert: x?.inventory?.lowStockAlert ?? "10",
    minOrder: x?.inventory?.minOrder ?? "1",
    maxOrder: x?.inventory?.maxOrder ?? "",
    backorder: x?.inventory?.backorder ?? false,
    // shipping
    shipWeight: x?.shipping?.weight ?? "",
    shipLength: x?.shipping?.length ?? "",
    shipWidth: x?.shipping?.width ?? "",
    shipHeight: x?.shipping?.height ?? "",
    shippingClass: x?.shipping?.shippingClass ?? "",
    freeShipping: x?.shipping?.freeShipping ?? false,
    // seo
    metaTitle: x?.seo?.metaTitle ?? "",
    metaDescription: x?.seo?.metaDescription ?? "",
    focusKeyword: x?.seo?.focusKeyword ?? "",
    canonicalUrl: x?.seo?.canonicalUrl ?? "",
    // pricing
    mrp: x?.pricing?.mrp ?? "",
    sellingPrice: initial ? String(initial.price) : "",
    discountType: x?.pricing?.discountType ?? "none",
    discountValue: x?.pricing?.discountValue ?? "",
    taxClass: x?.pricing?.taxClass ?? "",
    gst: x?.pricing?.gst ?? "18",
    // visibility
    vis: {
      featured: x?.visibility?.featured ?? false,
      bestseller: x?.visibility?.bestseller ?? false,
      newArrival: x?.visibility?.newArrival ?? false,
      limitedEdition: x?.visibility?.limitedEdition ?? false,
      recommended: x?.visibility?.recommended ?? false,
      trending: x?.visibility?.trending ?? false,
      homepage: x?.visibility?.homepage ?? false,
    },
    // specifications
    countryOfOrigin: x?.specifications?.countryOfOrigin ?? "India",
    manufacturer: x?.specifications?.manufacturer ?? "",
    shelfLife: x?.specifications?.shelfLife ?? "",
    batchNumber: x?.specifications?.batchNumber ?? "",
    mfgDate: x?.specifications?.mfgDate ?? "",
    expiryDate: x?.specifications?.expiryDate ?? "",
    alcoholPercent: x?.specifications?.alcoholPercent ?? "",
    // reviews
    reviewsEnabled: x?.reviews?.enabled ?? true,
    displayRating: x?.reviews?.displayRating ?? true,
    verifiedOnly: x?.reviews?.verifiedOnly ?? false,
    // related
    upsell: x?.related?.upsell ?? ([] as string[]),
    crossSell: x?.related?.crossSell ?? ([] as string[]),
    boughtTogether: x?.related?.boughtTogether ?? ([] as string[]),
    scheduledAt: x?.scheduledAt ?? "",
  });

  const [variants, setVariants] = useState<ProductVariant[]>(
    x?.variants ?? []
  );
  const [products, setProducts] = useState<Product[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [topError, setTopError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("basic");
  const [newCat, setNewCat] = useState(false);

  const [cats, setCats] = useState<string[]>([]);

  const slugTouched = useRef(Boolean(x?.slug));
  const skuTouched = useRef(Boolean(x?.sku || initial?.extras?.sku));

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data: Product[]) => setProducts(data))
      .catch(() => {});
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data: { name: string }[]) => setCats(data.map((c) => c.name)))
      .catch(() => {});
  }, []);

  const set = (patch: Partial<typeof f>) => setF((p) => ({ ...p, ...patch }));

  const categories = cats;
  const otherProducts = products.filter((p) => p.id !== initial?.id);

  function generateSku(brand: string, name: string) {
    const base = `${slugify(brand)}${slugify(name)}`.replace(/-/g, "").toUpperCase();
    if (!base) return "";
    const prefix = base.slice(0, 20);
    const suffix = otherProducts.filter((p) => {
      const sku = p.extras?.sku ?? "";
      return sku.startsWith(prefix);
    }).length + 1;
    return `${prefix}${String(suffix).padStart(2, "0")}`;
  }

  function syncSku(brand: string, name: string) {
    if (skuTouched.current) return;
    const generated = generateSku(brand, name);
    if (generated && generated !== f.sku) set({ sku: generated });
  }

  function setName(name: string) {
    set({ name, ...(slugTouched.current ? {} : { slug: slugify(name) }) });
    syncSku(f.brand, name);
  }

  function setBrand(brand: string) {
    set({ brand });
    syncSku(brand, f.name);
  }

  function goTo(id: string) {
    setActiveTab(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!f.name.trim()) errs.name = "Product name is required.";
    if (!f.brand.trim()) errs.brand = "Brand is required.";
    if (!f.sku.trim()) errs.sku = "SKU is required.";
    if (!f.category.trim()) errs.category = "Main category is required.";
    if (f.sellingPrice === "" || Number.isNaN(Number(f.sellingPrice)) || Number(f.sellingPrice) <= 0)
      errs.sellingPrice = "Enter a valid selling price.";
    setErrors(errs);
    if (Object.keys(errs).length) {
      const first = Object.keys(errs)[0];
      const section =
        first === "category" ? "category" : first === "sellingPrice" ? "pricing" : "basic";
      goTo(section);
      return false;
    }
    return true;
  }

  async function save(status: "draft" | "active", action: string) {
    if (!validate()) return;
    setTopError(null);
    setBusy(action);

    const payload = {
      name: f.name.trim(),
      description: (f.shortDescription.trim() || stripHtml(f.fullDescription)).slice(0, 400),
      price: Number(f.sellingPrice),
      category: f.category.trim(),
      stock: Number(f.stock) || 0,
      image: f.image || "/products/default.svg",
      extras: {
        slug: f.slug.trim() || slugify(f.name),
        brand: f.brand.trim(),
        sku: f.sku.trim(),
        couponCode: f.couponCode.trim(),
        status,
        subCategory: f.subCategory.trim(),
        collection: f.collection.trim(),
        tags: f.tags,
        shortDescription: f.shortDescription.trim(),
        fullDescription: f.fullDescription,
        keyFeatures: f.keyFeatures,
        howToUse: f.howToUse,
        ingredients: f.ingredients,
        warnings: f.warnings,
        fragrance: {
          gender: f.gender,
          family: f.family,
          topNotes: f.topNotes,
          heartNotes: f.heartNotes,
          baseNotes: f.baseNotes,
          concentration: f.concentration,
          longevity: f.longevity,
          sillage: f.sillage,
          season: f.season,
          occasion: f.occasion,
        },
        variants: variants.filter((v) => v.size.trim() !== ""),
        gallery: f.gallery,
        hoverImage: f.hoverImage,
        altText: f.altText.trim(),
        inventory: {
          track: f.track,
          lowStockAlert: f.lowStockAlert,
          minOrder: f.minOrder,
          maxOrder: f.maxOrder,
          backorder: f.backorder,
        },
        shipping: {
          weight: f.shipWeight,
          length: f.shipLength,
          width: f.shipWidth,
          height: f.shipHeight,
          shippingClass: f.shippingClass,
          freeShipping: f.freeShipping,
        },
        seo: {
          metaTitle: f.metaTitle.trim(),
          metaDescription: f.metaDescription.trim(),
          focusKeyword: f.focusKeyword.trim(),
          canonicalUrl: f.canonicalUrl.trim(),
        },
        pricing: {
          mrp: f.mrp,
          discountType: f.discountType,
          discountValue: f.discountValue,
          taxClass: f.taxClass,
          gst: f.gst,
        },
        visibility: f.vis,
        specifications: {
          countryOfOrigin: f.countryOfOrigin.trim(),
          manufacturer: f.manufacturer.trim(),
          shelfLife: f.shelfLife.trim(),
          batchNumber: f.batchNumber.trim(),
          mfgDate: f.mfgDate,
          expiryDate: f.expiryDate,
          alcoholPercent: f.alcoholPercent,
        },
        reviews: {
          enabled: f.reviewsEnabled,
          displayRating: f.displayRating,
          verifiedOnly: f.verifiedOnly,
        },
        related: {
          upsell: f.upsell,
          crossSell: f.crossSell,
          boughtTogether: f.boughtTogether,
        },
        scheduledAt: action === "schedule" ? f.scheduledAt : "",
      },
    };

    const res = initial
      ? await fetch(`/api/products/${initial.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
    setBusy(null);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setTopError(data?.error ?? "Something went wrong while saving.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    router.push("/admin/products");
    router.refresh();
  }

  async function handleDelete() {
    if (!initial) return;
    if (!confirm(`Delete "${initial.name}"? This cannot be undone.`)) return;
    setBusy("delete");
    await fetch(`/api/products/${initial.id}`, { method: "DELETE" });
    router.push("/admin/products");
    router.refresh();
  }

  function relatedPicker(
    label: string,
    key: "upsell" | "crossSell" | "boughtTogether"
  ) {
    const ids = f[key];
    return (
      <Field label={label}>
        <Select
          value=""
          onChange={(id) => {
            if (!ids.includes(id)) set({ [key]: [...ids, id] } as Partial<typeof f>);
          }}
          options={otherProducts
            .filter((p) => !ids.includes(p.id))
            .map((p) => ({ value: p.id, label: p.name }))}
          placeholder="Add a product…"
        />
        {ids.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {ids.map((id) => {
              const p = products.find((pr) => pr.id === id);
              return (
                <span
                  key={id}
                  className="flex items-center gap-1.5 rounded-full bg-accent/15 px-2.5 py-1 text-xs font-semibold text-accent"
                >
                  {p?.name ?? id}
                  <button
                    type="button"
                    onClick={() =>
                      set({ [key]: ids.filter((x2) => x2 !== id) } as Partial<typeof f>)
                    }
                    className="transition hover:text-danger"
                  >
                    ✕
                  </button>
                </span>
              );
            })}
          </div>
        )}
      </Field>
    );
  }

  const inputProps = (key: keyof typeof f) => ({
    value: String(f[key] ?? ""),
    onChange: (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => set({ [key]: e.target.value } as Partial<typeof f>),
  });

  return (
    <div className="w-full pb-24">
      {/* Sticky header: title + actions + section tabs */}
      <div className="sticky top-0 z-20 -mx-2 mb-8 rounded-b-2xl border-b border-line bg-background/90 px-2 pb-3 pt-4 backdrop-blur">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Link
              href="/admin/products"
              className="text-xs text-muted transition hover:text-accent"
            >
              ← Products
            </Link>
            <h1 className="text-xl font-bold">
              {initial ? `Edit: ${initial.name}` : "Add product"}
            </h1>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => save("draft", "draft")}
              disabled={busy !== null}
              className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-muted transition hover:border-accent/50 hover:text-accent disabled:opacity-50"
            >
              {busy === "draft" ? "Saving…" : "Save Draft"}
            </button>
            <button
              type="button"
              onClick={() => save("active", "publish")}
              disabled={busy !== null}
              className="rounded-lg bg-brand-gradient px-5 py-2 text-sm font-extrabold text-white shadow-lg shadow-accent/20 transition hover:brightness-110 disabled:opacity-50"
            >
              {busy === "publish" ? "Publishing…" : "Publish"}
            </button>
          </div>
        </div>
        <div className="scrollbar-none mt-3 flex gap-1.5 overflow-x-auto pb-0.5">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => goTo(s.id)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                activeTab === s.id
                  ? "bg-accent text-white"
                  : "bg-surface text-muted hover:text-foreground"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {topError && (
        <div className="animate-fade-in mb-6 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {topError}
        </div>
      )}

      <ActiveTabContext.Provider value={activeTab}>
      <div className="space-y-6">
        {/* 1. Basic Information */}
        <SectionCard id="basic" title="Basic Information">
          <Field label="Product Name" required error={errors.name}>
            <input
              value={f.name}
              onChange={(e) => setName(e.target.value)}
              className={controlClass}
              placeholder="Enter product name"
            />
          </Field>
          <Field label="Product Slug" hint="Auto-generated from the name — edit to customise.">
            <input
              value={f.slug}
              onChange={(e) => {
                slugTouched.current = true;
                set({ slug: slugify(e.target.value) });
              }}
              className={`${controlClass} font-mono text-xs`}
              placeholder="product-slug"
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Brand" required error={errors.brand}>
              <input
                value={f.brand}
                onChange={(e) => setBrand(e.target.value)}
                className={controlClass}
                placeholder="Enter brand name"
              />
            </Field>
            <Field label="SKU" required error={errors.sku} hint="Must be unique.">
              <input
                value={String(f.sku ?? "")}
                onChange={(e) => {
                  skuTouched.current = true;
                  set({ sku: e.target.value } as Partial<typeof f>);
                }}
                className={controlClass}
                placeholder="e.g. BZ-PRF-001"
              />
            </Field>
            <Field label="Coupon Code">
              <input
                value={String(f.couponCode ?? "")}
                onChange={(e) => set({ couponCode: e.target.value } as Partial<typeof f>)}
                className={controlClass}
                placeholder="e.g. SAVE10"
              />
            </Field>
          </div>
          <Field label="Product Status">
            <Select
              value={f.status}
              onChange={(v) => set({ status: v as typeof f.status })}
              options={[
                { value: "draft", label: "Draft" },
                { value: "active", label: "Active" },
                { value: "out-of-stock", label: "Out of Stock" },
                { value: "archived", label: "Archived" },
              ]}
            />
          </Field>
        </SectionCard>

        {/* 2. Category */}
        <SectionCard id="category" title="Category">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Main Category" required error={errors.category}>
              {newCat ? (
                <div className="flex gap-2">
                  <input
                    {...inputProps("category")}
                    className={controlClass}
                    placeholder="Enter new category name"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setNewCat(false);
                      set({ category: "" });
                    }}
                    className="shrink-0 rounded-lg border border-line px-3 text-xs text-muted transition hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <Select
                  value={f.category}
                  onChange={(v) => set({ category: v })}
                  options={categories.map((c) => ({ value: c, label: c }))}
                  placeholder="Select main category"
                  createLabel="Create new category"
                  onCreate={() => {
                    setNewCat(true);
                    set({ category: "" });
                  }}
                />
              )}
            </Field>
            <Field label="Sub Category">
              <input {...inputProps("subCategory")} className={controlClass} placeholder="Enter sub category" />
            </Field>
          </div>
          <Field label="Collection">
            <input {...inputProps("collection")} className={controlClass} placeholder="e.g. Summer 2026" />
          </Field>
          <Field label="Tags" hint="Press Enter or comma to add a tag.">
            <ChipsInput
              value={f.tags}
              onChange={(tags) => set({ tags })}
              placeholder="Type a tag and press Enter"
            />
          </Field>
        </SectionCard>

        {/* 3. Description */}
        <SectionCard id="description" title="Product Description">
          <Field label="Short Description" hint="Shown on product cards in the shop.">
            <textarea {...inputProps("shortDescription")} rows={2} className={`${controlClass} resize-none`} placeholder="Enter a short description" />
          </Field>
          <Field label="Full Description">
            <RichText initial={f.fullDescription} onChange={(html) => set({ fullDescription: html })} />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Key Features">
              <textarea {...inputProps("keyFeatures")} rows={3} className={`${controlClass} resize-none`} placeholder="One feature per line" />
            </Field>
            <Field label="How to Use">
              <textarea {...inputProps("howToUse")} rows={3} className={`${controlClass} resize-none`} placeholder="Application instructions" />
            </Field>
            <Field label="Ingredients">
              <textarea {...inputProps("ingredients")} rows={3} className={`${controlClass} resize-none`} placeholder="Ingredient list" />
            </Field>
            <Field label="Warnings & Safety Information">
              <textarea {...inputProps("warnings")} rows={3} className={`${controlClass} resize-none`} placeholder="Safety warnings" />
            </Field>
          </div>
        </SectionCard>

        {/* 5. Variants */}
        <SectionCard
          id="variants"
          title="Variants"
          subtitle="Add size-wise pricing and stock (10ml, 30ml, 50ml, 100ml…)."
        >
          {variants.map((v, i) => (
            <div
              key={i}
              className="animate-fade-up space-y-3 rounded-xl border border-line bg-surface-2/40 p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-wide text-accent">
                  VARIANT {i + 1}
                </span>
                <button
                  type="button"
                  onClick={() => setVariants(variants.filter((_, idx) => idx !== i))}
                  className="text-xs text-muted transition hover:text-danger"
                >
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {(
                  [
                    ["size", "Size", "e.g. 50ml"],
                    ["price", "Price (₹)", "0.00"],
                    ["comparePrice", "Compare Price (₹)", "0.00"],
                    ["costPrice", "Cost Price (₹)", "0.00"],
                    ["stock", "Stock Qty", "0"],
                    ["sku", "SKU", "BZ-50ML"],
                    ["weight", "Weight", "e.g. 120g"],
                    ["dimensions", "Dimensions", "L × W × H"],
                  ] as [keyof ProductVariant, string, string][]
                ).map(([key, label, ph]) => (
                  <label key={key} className="block">
                    <span className="mb-1 block text-[11px] font-medium text-muted">
                      {label}
                    </span>
                    <input
                      value={v[key]}
                      onChange={(e) =>
                        setVariants(
                          variants.map((vv, idx) =>
                            idx === i ? { ...vv, [key]: e.target.value } : vv
                          )
                        )
                      }
                      className={`${controlClass} px-2.5 py-2 text-xs`}
                      placeholder={ph}
                    />
                  </label>
                ))}
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setVariants([...variants, { ...emptyVariant }])}
            className="w-full rounded-xl border-2 border-dashed border-line py-3 text-sm font-semibold text-muted transition hover:border-accent hover:text-accent"
          >
            + Add variant
          </button>
        </SectionCard>

        {/* 6. Images */}
        <SectionCard
          id="images"
          title="Images"
          subtitle="Sab images database mein save hoti hain — drag & drop supported."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Featured Image">
              <UploadBox
                image={f.image}
                onImage={(image) => set({ image })}
                onError={setTopError}
                emptyLabel="Add featured image"
              />
            </Field>
            <Field label="Hover Image" hint="Shown when the card is hovered (optional).">
              <UploadBox
                image={f.hoverImage}
                onImage={(hoverImage) => set({ hoverImage })}
                onError={setTopError}
                emptyLabel="Add hover image"
              />
            </Field>
          </div>
          <Field label="Gallery Images">
            <GalleryUpload
              images={f.gallery}
              onImages={(gallery) => set({ gallery })}
              onError={setTopError}
            />
          </Field>
          <Field label="Alt Text" hint="Describes the image for SEO and screen readers.">
            <input {...inputProps("altText")} className={controlClass} placeholder="Enter image alt text" />
          </Field>
        </SectionCard>

        {/* 7. Inventory */}
        <SectionCard id="inventory" title="Inventory">
          <Toggle
            checked={f.track}
            onChange={(track) => set({ track })}
            label="Track Inventory"
            hint="Stock automatically adjusts as orders come in."
          />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label="Available Quantity">
              <input {...inputProps("stock")} type="number" min="0" className={controlClass} />
            </Field>
            <Field label="Low Stock Alert">
              <input {...inputProps("lowStockAlert")} type="number" min="0" className={controlClass} />
            </Field>
            <Field label="Min Order Qty">
              <input {...inputProps("minOrder")} type="number" min="1" className={controlClass} />
            </Field>
            <Field label="Max Order Qty">
              <input {...inputProps("maxOrder")} type="number" min="0" className={controlClass} placeholder="No limit" />
            </Field>
          </div>
          <Toggle
            checked={f.backorder}
            onChange={(backorder) => set({ backorder })}
            label="Backorder Enabled"
            hint="Allow orders even when stock runs out."
          />
        </SectionCard>

        {/* 8. Shipping */}
        <SectionCard id="shipping" title="Shipping">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label="Weight">
              <input {...inputProps("shipWeight")} className={controlClass} placeholder="e.g. 250g" />
            </Field>
            <Field label="Length">
              <input {...inputProps("shipLength")} className={controlClass} placeholder="cm" />
            </Field>
            <Field label="Width">
              <input {...inputProps("shipWidth")} className={controlClass} placeholder="cm" />
            </Field>
            <Field label="Height">
              <input {...inputProps("shipHeight")} className={controlClass} placeholder="cm" />
            </Field>
          </div>
          <Field label="Shipping Class">
            <Select
              value={f.shippingClass}
              onChange={(v) => set({ shippingClass: v })}
              options={[
                { value: "standard", label: "Standard" },
                { value: "express", label: "Express" },
                { value: "fragile", label: "Fragile" },
                { value: "heavy", label: "Heavy / Bulky" },
              ]}
              placeholder="Select shipping class"
            />
          </Field>
          <Toggle
            checked={f.freeShipping}
            onChange={(freeShipping) => set({ freeShipping })}
            label="Free Shipping"
            hint="Customer pays nothing for delivery."
          />
        </SectionCard>

        {/* 9. SEO */}
        <SectionCard id="seo" title="SEO">
          <Field label="Meta Title">
            <input {...inputProps("metaTitle")} className={controlClass} placeholder="Enter meta title" />
          </Field>
          <Field label="Meta Description">
            <textarea {...inputProps("metaDescription")} rows={2} className={`${controlClass} resize-none`} placeholder="Enter meta description (max ~160 chars)" />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Focus Keyword">
              <input {...inputProps("focusKeyword")} className={controlClass} placeholder="Enter focus keyword" />
            </Field>
            <Field label="Canonical URL">
              <input {...inputProps("canonicalUrl")} className={controlClass} placeholder="https://…" />
            </Field>
          </div>
          <p className="text-[11px] text-muted">
            Open Graph image: featured image is used automatically.
          </p>
        </SectionCard>

        {/* 10. Pricing */}
        <SectionCard id="pricing" title="Pricing">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="MRP (₹)">
              <input {...inputProps("mrp")} type="number" min="0" step="0.01" className={controlClass} placeholder="Enter MRP" />
            </Field>
            <Field label="Selling Price (₹)" required error={errors.sellingPrice}>
              <input {...inputProps("sellingPrice")} type="number" min="0" step="0.01" className={controlClass} placeholder="Enter selling price" />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Discount Type">
              <Select
                value={f.discountType}
                onChange={(v) => set({ discountType: v })}
                options={[
                  { value: "none", label: "No Discount" },
                  { value: "percent", label: "Percentage (%)" },
                  { value: "flat", label: "Flat Amount (₹)" },
                ]}
              />
            </Field>
            <Field label="Discount Value">
              <input
                {...inputProps("discountValue")}
                type="number"
                min="0"
                className={controlClass}
                placeholder={f.discountType === "percent" ? "e.g. 20" : "e.g. 500"}
              />
            </Field>
            <Field label="Tax Class">
              <input {...inputProps("taxClass")} className={controlClass} placeholder="e.g. Cosmetics" />
            </Field>
            <Field label="GST %">
              <Select
                value={f.gst}
                onChange={(v) => set({ gst: v })}
                options={[
                  { value: "0", label: "0%" },
                  { value: "5", label: "5%" },
                  { value: "12", label: "12%" },
                  { value: "18", label: "18%" },
                  { value: "28", label: "28%" },
                ]}
              />
            </Field>
          </div>
        </SectionCard>

        {/* 11. Visibility */}
        <SectionCard id="visibility" title="Visibility">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(
              [
                ["featured", "Featured Product"],
                ["bestseller", "Bestseller"],
                ["newArrival", "New Arrival"],
                ["limitedEdition", "Limited Edition"],
                ["recommended", "Recommended Product"],
                ["trending", "Trending"],
                ["homepage", "Homepage Display"],
              ] as [keyof typeof f.vis, string][]
            ).map(([key, label]) => (
              <Toggle
                key={key}
                checked={f.vis[key]}
                onChange={(v) => set({ vis: { ...f.vis, [key]: v } })}
                label={label}
              />
            ))}
          </div>
        </SectionCard>

        {/* 12. Specifications */}
        <SectionCard id="specs" title="Product Specifications">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Country of Origin">
              <input {...inputProps("countryOfOrigin")} className={controlClass} placeholder="Enter country of origin" />
            </Field>
            <Field label="Manufacturer">
              <input {...inputProps("manufacturer")} className={controlClass} placeholder="Enter manufacturer name" />
            </Field>
            <Field label="Shelf Life">
              <input {...inputProps("shelfLife")} className={controlClass} placeholder="e.g. 36 months" />
            </Field>
            <Field label="Batch Number">
              <input {...inputProps("batchNumber")} className={controlClass} placeholder="Enter batch number" />
            </Field>
            <Field label="Manufacturing Date">
              <input {...inputProps("mfgDate")} type="date" className={controlClass} />
            </Field>
            <Field label="Expiry Date">
              <input {...inputProps("expiryDate")} type="date" className={controlClass} />
            </Field>
          </div>
          <Field label="Alcohol Percentage">
            <input {...inputProps("alcoholPercent")} type="number" min="0" max="100" className={controlClass} placeholder="e.g. 70" />
          </Field>
        </SectionCard>

        {/* 13. Reviews */}
        <SectionCard id="reviews" title="Reviews">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Toggle
              checked={f.reviewsEnabled}
              onChange={(reviewsEnabled) => set({ reviewsEnabled })}
              label="Enable Reviews"
            />
            <Toggle
              checked={f.displayRating}
              onChange={(displayRating) => set({ displayRating })}
              label="Display Rating"
            />
            <Toggle
              checked={f.verifiedOnly}
              onChange={(verifiedOnly) => set({ verifiedOnly })}
              label="Verified Purchase Only"
            />
          </div>
        </SectionCard>

        {/* 14. Related Products */}
        <SectionCard id="related" title="Related Products">
          {relatedPicker("Upsell Products", "upsell")}
          {relatedPicker("Cross Sell Products", "crossSell")}
          {relatedPicker("Frequently Bought Together", "boughtTogether")}
        </SectionCard>

        {/* 15. Publishing */}
        <SectionCard id="publish" title="Publishing">
          <Field
            label="Schedule Publish"
            hint="Product draft mein save hoga aur scheduled time note ho jayega."
          >
            <input
              {...inputProps("scheduledAt")}
              type="datetime-local"
              className={controlClass}
            />
          </Field>
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => save("draft", "draft")}
              disabled={busy !== null}
              className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-muted transition hover:border-accent/50 hover:text-accent disabled:opacity-50"
            >
              Save Draft
            </button>
            {initial && (
              <a
                href={`/shop/products/${initial.id}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-muted transition hover:border-accent/50 hover:text-accent"
              >
                Preview ↗
              </a>
            )}
            <button
              type="button"
              onClick={() => save("draft", "schedule")}
              disabled={busy !== null || !f.scheduledAt}
              className="rounded-lg border border-accent/40 px-4 py-2.5 text-sm font-semibold text-accent transition hover:bg-accent/10 disabled:opacity-40"
            >
              {busy === "schedule" ? "Scheduling…" : "Schedule Publish"}
            </button>
            <button
              type="button"
              onClick={() => save("active", "publish")}
              disabled={busy !== null}
              className="rounded-lg bg-brand-gradient px-6 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-accent/20 transition hover:brightness-110 disabled:opacity-50"
            >
              {busy === "publish" ? "Publishing…" : "Publish"}
            </button>
            {initial && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={busy !== null}
                className="ml-auto rounded-lg border border-danger/40 px-4 py-2.5 text-sm font-semibold text-danger transition hover:bg-danger/10 disabled:opacity-50"
              >
                {busy === "delete" ? "Deleting…" : "Delete"}
              </button>
            )}
          </div>
        </SectionCard>
      </div>
      </ActiveTabContext.Provider>

      {/* Previous / Next tab navigation */}
      {(() => {
        const idx = SECTIONS.findIndex((s) => s.id === activeTab);
        const prev = SECTIONS[idx - 1];
        const next = SECTIONS[idx + 1];
        return (
          <div className="mt-6 flex items-center justify-between">
            {prev ? (
              <button
                type="button"
                onClick={() => goTo(prev.id)}
                className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-muted transition hover:border-accent/50 hover:text-accent"
              >
                ← {prev.label}
              </button>
            ) : (
              <span />
            )}
            {next ? (
              <button
                type="button"
                onClick={() => goTo(next.id)}
                className="rounded-lg bg-surface px-4 py-2.5 text-sm font-semibold text-foreground ring-1 ring-line transition hover:text-accent hover:ring-accent/50"
              >
                {next.label} →
              </button>
            ) : (
              <span />
            )}
          </div>
        );
      })()}
    </div>
  );
}
