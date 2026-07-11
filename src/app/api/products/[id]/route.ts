import { NextResponse } from "next/server";
import {
  deleteProduct,
  getProduct,
  updateProduct,
  type ProductInput,
} from "@/lib/products";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  const { id } = await params;
  const product = getProduct(id);
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  return NextResponse.json(product);
}

export async function PUT(request: Request, { params }: Context) {
  const { id } = await params;
  const body = (await request.json()) as Partial<ProductInput>;
  const product = updateProduct(id, body);
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  return NextResponse.json(product);
}

export async function DELETE(_request: Request, { params }: Context) {
  const { id } = await params;
  const deleted = deleteProduct(id);
  if (!deleted) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
