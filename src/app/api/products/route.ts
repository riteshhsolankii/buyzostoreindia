import { NextResponse } from "next/server";
import { createProduct, listProducts, type ProductInput } from "@/lib/products";

export async function GET() {
  return NextResponse.json(listProducts());
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<ProductInput>;

  if (!body.name || body.price === undefined) {
    return NextResponse.json(
      { error: "name and price are required" },
      { status: 400 }
    );
  }

  const product = createProduct({
    name: body.name,
    description: body.description ?? "",
    price: Number(body.price),
    category: body.category ?? "General",
    stock: Number(body.stock ?? 0),
    emoji: body.emoji ?? "📦",
    image: body.image?.trim() || "/products/default.svg",
  });

  return NextResponse.json(product, { status: 201 });
}
