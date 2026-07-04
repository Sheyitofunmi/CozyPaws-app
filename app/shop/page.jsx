import { Suspense } from "react";
import ShopPage from "@/components/ShopPage";

export const metadata = {
  title: "Shop — CozyPaws",
  description:
    "Shop toys, treats, cozy beds and everything else your dog loves at CozyPaws.",
};

export default function Shop() {
  return (
    <Suspense fallback={<div className="shop-page cozy-page" />}>
      <ShopPage />
    </Suspense>
  );
}
