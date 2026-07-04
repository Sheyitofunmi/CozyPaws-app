import "./globals.css";
import { Inter, DM_Serif_Display } from "next/font/google";
import { CartProvider } from "@/lib/cart";
import { WishlistProvider } from "@/lib/wishlist";
import CartDrawer from "@/components/CartDrawer";
import WishlistDrawer from "@/components/WishlistDrawer";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
});

const dmSerifDisplay = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-dm-serif",
});

export const metadata = {
  title: "CozyPaws — Everything Your Pets Love",
  description:
    "CozyPaws is a pet store for dogs — toys, treats, cozy houses and everything your best friend loves.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${dmSerifDisplay.variable}`}>
      <body suppressHydrationWarning>
        <CartProvider>
          <WishlistProvider>
            {children}
            <CartDrawer />
            <WishlistDrawer />
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}
