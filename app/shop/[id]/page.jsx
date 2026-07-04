import { notFound } from "next/navigation";
import { PRODUCTS } from "@/lib/data";
import ProductDetail from "@/components/ProductDetail";

export function generateStaticParams() {
  return PRODUCTS.map((product) => ({ id: product.id }));
}

export function generateMetadata({ params }) {
  const product = PRODUCTS.find((p) => p.id === params.id);
  if (!product) return { title: "Product not found — CozyPaws" };
  return {
    title: `${product.name} — CozyPaws`,
    description: `${product.name} — $${product.price.toFixed(2)} in ${product.category} at CozyPaws.`,
  };
}

export default function ProductPage({ params }) {
  const product = PRODUCTS.find((p) => p.id === params.id);
  if (!product) notFound();
  return <ProductDetail product={product} />;
}
