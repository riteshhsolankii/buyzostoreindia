import type { Metadata } from "next";
import { CartProvider } from "./cart-context";
import { CustomerProvider } from "./customer-context";
import { WishlistProvider } from "./wishlist-context";

export const metadata: Metadata = {
  title: "Buyzo Shop",
};

// Chrome (header/footer) lives in the (store) route group so standalone
// pages like /shop/account can render without it.
export default function ShopLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <CustomerProvider>
      <WishlistProvider>
        <CartProvider>{children}</CartProvider>
      </WishlistProvider>
    </CustomerProvider>
  );
}
