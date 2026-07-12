"use client";

import { use } from "react";
import { ProductDetailView } from "../../product-detail-view";

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return <ProductDetailView productId={id} />;
}
