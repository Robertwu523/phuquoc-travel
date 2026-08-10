// Live exchange rates via open.er-api.com (free, keyless, CN-reachable, has VND).
// Base HKD (the site's departure currency). Cached 1h (free tier updates ~daily).

const PAIR = ["HKD", "VND", "CNY", "USD"] as const;

export async function GET() {
  try {
    const r = await fetch("https://open.er-api.com/v6/latest/HKD", {
      next: { revalidate: 3600 },
    });
    if (!r.ok) return Response.json({ error: "upstream" }, { status: 502 });
    const d = await r.json();
    const rates: Record<string, number> = { HKD: 1 };
    for (const c of PAIR) if (d.rates?.[c] != null) rates[c] = d.rates[c];
    return Response.json({
      base: "HKD",
      rates,
      time: d.time_last_update_utc ?? null,
    });
  } catch {
    return Response.json({ error: "rates-unreachable" }, { status: 502 });
  }
}
