import { NextResponse } from "next/server";
import { createProduct, listProducts, type ProductInput } from "@/lib/products";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await listProducts(), {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<ProductInput>;

  if (!body.name || body.price === undefined) {
    return NextResponse.json(
      { error: "name and price are required" },
      { status: 400 }
    );
  }
  if (Number.isNaN(Number(body.price))) {
    return NextResponse.json(
      { error: "Price must be a number." },
      { status: 400 }
    );
  }
  // Images are stored as data URLs in the database — keep them sane.
  if (body.image && body.image.length > 4_000_000) {
    return NextResponse.json({ error: "Image is too large." }, { status: 400 });
  }
  // SKU must be unique across the catalog.
  const sku = body.extras?.sku?.trim();
  if (sku && (await listProducts()).some((p) => p.extras?.sku === sku)) {
    return NextResponse.json(
      { error: `SKU "${sku}" is already used by another product.` },
      { status: 409 }
    );
  }

  const product = await createProduct({
    name: body.name,
    description: body.description ?? "",
    price: Number(body.price),
    category: body.category ?? "General",
    stock: Number(body.stock ?? 0),
    emoji: body.emoji ?? "📦",
    image: body.image?.trim() || "/products/default.svg",
    extras: body.extras ?? {},
  });

  return NextResponse.json(product, { status: 201 });
}
