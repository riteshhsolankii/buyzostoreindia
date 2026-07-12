"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import type { Product } from "@/lib/types";
import { ProductForm } from "../../product-form";

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/products/${id}`).then(async (res) => {
      if (!res.ok) {
        setNotFound(true);
        return;
      }
      setProduct(await res.json());
    });
  }, [id]);

  if (notFound) {
    return (
      <div className="py-20 text-center">
        <h1 className="mb-2 text-xl font-semibold">Product not found</h1>
        <Link href="/admin/products" className="text-accent hover:underline">
          ← Back to products
        </Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="w-full space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-48 animate-pulse rounded-2xl border border-line bg-surface" />
        ))}
      </div>
    );
  }

  return <ProductForm initial={product} />;
}
