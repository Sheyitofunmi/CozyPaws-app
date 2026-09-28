import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { kv } from "@/lib/server/kv";
import { INP_GOOD_MS, INP_POOR_MS, percentile, rate, type InpBucket, type InpSample } from "@/lib/vitals";

export const dynamic = "force-dynamic";
export const metadata = { title: "Field INP | CozyPaws", robots: { index: false } };

const BUCKETS: { id: InpBucket; label: string; note: string }[] = [
  { id: "page", label: "page INP", note: "the Core Web Vital: each visit's slowest interaction" },
  { id: "search", label: "shop search", note: "every keystroke and click in the search box" },
  { id: "cart-stepper", label: "cart stepper", note: "every + / − tap, in the shop, cart and product page" },
];

function summarise(samples: InpSample[], device?: InpSample["device"]) {
  const values = samples.filter((s) => !device || s.device === device).map((s) => s.value);
  const p75 = percentile(values, 75);
  return {
    count: values.length,
    p75,
    p95: percentile(values, 95),
    good: values.length ? Math.round((values.filter((v) => v <= INP_GOOD_MS).length / values.length) * 100) : null,
  };
}

const ms = (v: number | null) => (v === null ? "—" : `${Math.round(v)} ms`);

export default async function VitalsPage() {
  const data = Object.fromEntries(
    await Promise.all(BUCKETS.map(async (b) => [b.id, await kv.list<InpSample>(`vitals:inp:${b.id}`)] as const)),
  ) as Record<InpBucket, InpSample[]>;

  // Where page INP time goes, for the slowest visits.
  const slowest = [...data.page].sort((a, b) => b.value - a.value).slice(0, 8);

  return (
    <div className="cozy-page vitals-page">
      <SiteHeader />
      <main className="vitals">
        <p className="vitals__eyebrow">field data · last 30 days · {kv.backend === "redis" ? "shared store" : "this server only"}</p>
        <h1 className="vitals__title">
          how fast it <span className="accent">feels</span>
        </h1>
        <p className="vitals__lead">
          Interaction to Next Paint from real visits, measured with the web-vitals library and the Event Timing
          API. Good is {INP_GOOD_MS} ms or less at the 75th percentile; poor is over {INP_POOR_MS} ms.
        </p>

        <div className="vitals__table-wrap">
          <table className="vitals__table">
            <caption className="visually-hidden">INP by control and device</caption>
            <thead>
              <tr>
                <th scope="col">what</th>
                <th scope="col">device</th>
                <th scope="col">samples</th>
                <th scope="col">p75</th>
                <th scope="col">p95</th>
                <th scope="col">good</th>
              </tr>
            </thead>
            <tbody>
              {BUCKETS.flatMap((b) =>
                (["mobile", "desktop"] as const).map((device, i) => {
                  const s = summarise(data[b.id], device);
                  return (
                    <tr key={`${b.id}-${device}`}>
                      {i === 0 && (
                        <th scope="rowgroup" rowSpan={2}>
                          {b.label}
                          <small>{b.note}</small>
                        </th>
                      )}
                      <td>{device}</td>
                      <td>{s.count}</td>
                      <td>
                        {s.p75 === null ? "—" : <span className={`vitals__pill vitals__pill--${rate(s.p75)}`}>{ms(s.p75)}</span>}
                      </td>
                      <td>{ms(s.p95)}</td>
                      <td>{s.good === null ? "—" : `${s.good}%`}</td>
                    </tr>
                  );
                }),
              )}
            </tbody>
          </table>
        </div>

        <h2 className="vitals__subtitle">slowest visits, broken down</h2>
        {slowest.length === 0 ? (
          <p className="vitals__empty">No samples yet. They arrive as people use the live site.</p>
        ) : (
          <ol className="vitals__slow">
            {slowest.map((s, i) => (
              <li key={i}>
                <strong>{ms(s.value)}</strong> on <code>{s.path}</code> ({s.device})
                <span>
                  input delay {ms(s.inputDelay ?? null)} · processing {ms(s.processing ?? null)} · presentation{" "}
                  {ms(s.presentation ?? null)}
                </span>
                {s.target && <code className="vitals__target">{s.target}</code>}
              </li>
            ))}
          </ol>
        )}

        <p className="vitals__note">
          Control samples come from Event Timing, which only reports interactions slower than 16 ms, so their
          percentiles lean slightly high. Safari doesn&apos;t support Event Timing yet, so these numbers are from
          Chromium and Firefox visitors.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
