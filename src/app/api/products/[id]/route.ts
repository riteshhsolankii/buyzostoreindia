import { NextResponse } from "next/server";
import {
  deleteProduct,
  getProduct,
  listProducts,
  updateProduct,
  type ProductInput,
} from "@/lib/products";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  return NextResponse.json(product);
}

export async function PUT(request: Request, { params }: Context) {
  const { id } = await params;
  const body = (await request.json()) as Partial<ProductInput>;
  if (body.image && body.image.length > 4_000_000) {
    return NextResponse.json({ error: "Image is too large." }, { status: 400 });
  }
  const sku = body.extras?.sku?.trim();
  if (
    sku &&
    (await listProducts()).some((p) => p.id !== id && p.extras?.sku === sku)
  ) {
    return NextResponse.json(
      { error: `SKU "${sku}" is already used by another product.` },
      { status: 409 }
    );
  }
  const product = await updateProduct(id, body);
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  return NextResponse.json(product);
}

export async function DELETE(_request: Request, { params }: Context) {
  const { id } = await params;
  const deleted = await deleteProduct(id);
  if (!deleted) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
