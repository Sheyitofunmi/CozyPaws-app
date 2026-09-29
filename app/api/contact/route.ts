import { NextResponse } from "next/server";

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

type Topic = "order" | "wholesale" | "hi";
type Field = "name" | "email" | "message" | "orderNumber" | "company";

/** A trimmed string field, or "" if it's missing or not a string (never throws on odd input). */
const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (typeof parsed !== "object" || parsed === null) throw new Error("not an object");
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body." },
      { status: 400 },
    );
  }

  const name = str(body.name);
  const email = str(body.email);
  const message = str(body.message);
  const topic = body.topic as Topic | undefined;

  const errors: Partial<Record<Field, string>> = {};
  if (name.length < 2) errors.name = "Please tell us your name.";
  if (!isEmail(email)) errors.email = "That email doesn't look right.";
  if (message.length < 10)
    errors.message = "A little more detail helps us help you.";

  // Topic-specific fields (the form only shows these for their topic).
  const orderNumber = str(body.orderNumber).toUpperCase();
  const company = str(body.company);
  if (topic === "order" && !/^CP-[A-Z0-9]{4,}$/.test(orderNumber))
    errors.orderNumber = "Order numbers start with CP- (it's on your receipt).";
  if (topic === "wholesale" && company.length < 2)
    errors.company = "Which shop or company is this for?";

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ ok: false, errors }, { status: 422 });
  }

  console.log("[contact] new message", { name, email, topic, orderNumber, company });

  const first = name.split(" ")[0] ?? name;
  const replies: Record<Topic, string> = {
    order: `Thanks ${first}! We've pulled up ${orderNumber} and will reply within one business day.`,
    wholesale: `Thanks ${first}! Our wholesale team will get back to ${company} within two business days.`,
    hi: body.hasPhoto
      ? `Thanks ${first}! Best photo we've seen all day (don't tell Biscuit).`
      : `Thanks ${first}! Hi back from the whole pack.`,
  };
  return NextResponse.json({
    ok: true,
    message: (topic && replies[topic]) ?? `Thanks ${first}! We'll bark back within one business day.`,
  });
}
