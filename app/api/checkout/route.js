import { NextResponse } from "next/server";
import { PRODUCTS } from "@/lib/data";

// Demo checkout endpoint — validates the shipping details and cart, then
// returns a fake order confirmation. No payment is processed.

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const SHIPPING = 4.99;
const FREE_SHIPPING_THRESHOLD = 50;

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body." },
      { status: 400 },
    );
  }

  const { customer = {}, items = [] } = body;
  const errors = {};

  if ((customer.name || "").trim().length < 2)
    errors.name = "Please enter your name.";
  if (!isEmail((customer.email || "").trim()))
    errors.email = "Enter a valid email.";
  if ((customer.address || "").trim().length < 5)
    errors.address = "Enter a delivery address.";
  if ((customer.city || "").trim().length < 2) errors.city = "Enter your city.";
  if ((customer.zip || "").trim().length < 3)
    errors.zip = "Enter a postal code.";

  if (!Array.isArray(items) || items.length === 0)
    errors.items = "Your cart is empty.";

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ ok: false, errors }, { status: 422 });
  }

  // Re-price server-side from the catalog so the client can't set prices.
  let subtotal = 0;
  for (const line of items) {
    const product = PRODUCTS.find((p) => p.id === line.id);
    if (!product) continue;
    subtotal += product.price * Math.max(1, Number(line.qty) || 1);
  }

  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING;
  const total = subtotal + shipping;
  const orderId = `CP-${Date.now().toString(36).toUpperCase()}`;

  console.log("[checkout] order placed", {
    orderId,
    email: customer.email,
    total,
  });

  return NextResponse.json({
    ok: true,
    orderId,
    subtotal: Number(subtotal.toFixed(2)),
    shipping,
    total: Number(total.toFixed(2)),
    message: `Order ${orderId} confirmed! A very good confirmation email is on its way.`,
  });
}
