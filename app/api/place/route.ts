// Server-side proxy to OpenStreetMap Overpass API.
// Finds the nearest *named* OSM feature to the given point and returns its name.
// OSM has good Vietnam coverage, so this gives specific place names for Phu Quoc
// (unlike AMap/BigdataCloud which are region-level or empty abroad).
// Keyless, free, no VPN. kumi mirror is the most reachable from mainland China.

import { haversineKm } from "@/lib/stops";

const ENDPOINTS = [
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

// Tags that make a feature a useful "place" (prefer these over generic roads).
const POI_TAGS = [
  "tourism",
  "amenity",
  "shop",
  "leisure",
  "historic",
  "natural",
  "man_made",
  "attraction",
];

type Candidate = {
  name: string;
  nameEn?: string;
  nameZh?: string;
  kind: string;
  distKm: number;
  isPoi: boolean;
  lat: number;
  lng: number;
};

function pickName(tags: Record<string, string>): string | null {
  return tags["name:zh"] || tags["name:en"] || tags["name"] || null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return Response.json({ error: "missing-lat-lng" }, { status: 400 });
  }

  const query = `[out:json][timeout:8];(node(around:400,${lat},${lng})["name"];way(around:400,${lat},${lng})["name"];);out center 20;`;

  for (const url of ENDPOINTS) {
    // Bound each endpoint so a slow server doesn't hang the request; the client
    // then falls back to BigdataCloud region-level naming.
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          // Overpass requires a meaningful User-Agent or it rate-limits you.
          "User-Agent": "phuquoc-trip-planner/1.0 (personal trip planning app)",
        },
        body: "data=" + encodeURIComponent(query),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (!r.ok) continue;
      const d = await r.json();
      const els: unknown[] = Array.isArray(d?.elements) ? d.elements : [];

      const candidates: Candidate[] = [];
      for (const e0 of els) {
        const e = e0 as {
          type: string;
          lat?: number;
          lon?: number;
          center?: { lat: number; lon: number };
          tags?: Record<string, string>;
        };
        const c = e.type === "node" ? { lat: e.lat!, lon: e.lon! } : e.center;
        if (!c || !e.tags) continue;
        const name = pickName(e.tags);
        if (!name) continue;
        const kind =
          POI_TAGS.map((t) => e.tags![t]).find(Boolean) || e.tags.highway || "place";
        candidates.push({
          name,
          nameEn: e.tags["name:en"],
          nameZh: e.tags["name:zh"],
          kind: String(kind),
          distKm: haversineKm(lat, lng, c.lat, c.lon),
          isPoi: POI_TAGS.some((t) => t in e.tags!),
          lat: c.lat,
          lng: c.lon,
        });
      }
      if (candidates.length) {
        candidates.sort((a, b) => {
          // prefer POIs, then nearer
          if (a.isPoi !== b.isPoi) return a.isPoi ? -1 : 1;
          return a.distKm - b.distKm;
        });
        const best = candidates[0];
        return Response.json({
          name: best.nameZh || best.nameEn || best.name,
          info: `${best.name}${best.distKm < 0.05 ? "" : ` · ~${Math.round(best.distKm * 1000)}m`} · ${best.kind}`,
          kind: best.kind,
          // precise coordinates of the matched feature (for refining markers)
          lat: best.lat,
          lng: best.lng,
        });
      }
      // reachable but nothing named nearby
      return Response.json({ name: null });
    } catch {
      /* try next endpoint */
    }
  }
  return Response.json({ error: "overpass-unreachable" }, { status: 502 });
}
