import { NextResponse } from "next/server";
import { paymentsConfig } from "@/lib/server/payments";

/** Tells the browser whether real wallet payments are on, and where to pay. */
export function GET() {
  return NextResponse.json(paymentsConfig(), { headers: { "Cache-Control": "public, max-age=60" } });
}
