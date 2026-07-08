import { NextResponse } from "next/server";

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

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

  const name = (body.name || "").trim();
  const email = (body.email || "").trim();
  const message = (body.message || "").trim();

  const errors = {};
  if (name.length < 2) errors.name = "Please tell us your name.";
  if (!isEmail(email)) errors.email = "That email doesn't look right.";
  if (message.length < 10)
    errors.message = "A little more detail helps us help you.";

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ ok: false, errors }, { status: 422 });
  }

  console.log("[contact] new message", { name, email, topic: body.topic });

  return NextResponse.json({
    ok: true,
    message: `Thanks ${name.split(" ")[0]}! We'll bark back within one business day.`,
  });
}
