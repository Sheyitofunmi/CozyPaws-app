import type { Metadata } from "next";
import CartPage from "@/components/CartPage";

export const metadata: Metadata = {
  title: "Your cart — CozyPaws",
  description: "Review your cart and check out at CozyPaws.",
};

export default function Cart() {
  return <CartPage />;
}
