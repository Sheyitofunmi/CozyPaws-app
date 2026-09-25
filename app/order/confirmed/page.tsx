import type { Metadata } from "next";
import OrderConfirmation from "@/components/OrderConfirmation";

export const metadata: Metadata = {
  title: "Order confirmed | CozyPaws",
  robots: { index: false },
};

export default function OrderConfirmedPage() {
  return <OrderConfirmation />;
}
