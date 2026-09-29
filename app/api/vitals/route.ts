import { NextResponse, type NextRequest } from "next/server";
import { kv } from "@/lib/server/kv";
import { isInpSample, type InpSample } from "@/lib/vitals";

/*
 * Collects field INP samples (see components/VitalsReporter.tsx) into the
 * shared KV store: one capped list per bucket, kept for 30 days.
 * The summary is shown at /vitals.
 */
const MAX_PER_BUCKET = 2_000;
const TTL_S = 60 * 60 * 24 * 30;

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = JSON.parse(await req.text());
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  const samples = (Array.isArray(body) ? body : []).filter(isInpSample).slice(0, 50);
  await Promise.all(
    samples.map((s: InpSample) =>
      kv.pushCapped(`vitals:inp:${s.bucket}`, { ...s, at: Date.now() }, MAX_PER_BUCKET, TTL_S),
    ),
  );
  return new NextResponse(null, { status: 204 });
}
