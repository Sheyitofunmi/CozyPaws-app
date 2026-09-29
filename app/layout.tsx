import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { preload } from "react-dom";
import { Inter, DM_Serif_Display } from "next/font/google";
import { CartProvider } from "@/lib/cart";
import { WishlistProvider } from "@/lib/wishlist";
import CartDrawer from "@/components/CartDrawer";
import WishlistDrawer from "@/components/WishlistDrawer";
import CartToast from "@/components/CartToast";
import DemoPanelGate from "@/components/DemoPanelGate";
import VitalsReporter from "@/components/VitalsReporter";
import ViewTransitionListener from "@/components/ViewTransitionListener";

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

export const metadata: Metadata = {
  title: "CozyPaws | Everything Your Dog Loves",
  description:
    "CozyPaws is a pet store for dogs — toys, treats, cozy houses and everything your best friend loves.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  // Epilogue is the headline font on the landing page: fetch it early.
  preload("/fonts/Epilogue-VariableFont_wght.woff2", {
    as: "font",
    type: "font/woff2",
    crossOrigin: "anonymous",
  });

  return (
    <html lang="en" className={`${inter.variable} ${dmSerifDisplay.variable}`}>
      <body suppressHydrationWarning>
        <CartProvider>
          <WishlistProvider>
            {children}
            <CartDrawer />
            <WishlistDrawer />
            <CartToast />
            <DemoPanelGate />
            <VitalsReporter />
            <ViewTransitionListener />
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}
