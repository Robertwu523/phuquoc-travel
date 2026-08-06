// Place search via Photon (komoot's OSM geocoder) — fast, reliable, proper text
// search. Restricted to Phu Quoc (island + An Thoi) via bbox. Chinese queries
// are first mapped to English keywords (lib/zhmap.ts) since OSM names in Vietnam
// are Vietnamese/English. Falls back to Overpass if Photon is unreachable.

import { zhToEn } from "@/lib/zhmap";

// Phu Quoc island + An Thoi islands bbox: minlon,minlat,maxlon,maxlat
// (An Thoi sits ~104.0°, just south of the main island)
const BBOX = "103.82,9.78,104.10,10.33";
const PHOTON = "https://photon.komoot.io/api/";
const UA = "phuquoc-trip-planner/1.0 (personal trip planning app)";

type Hit = {
  name: string;
  kind: string;
  lat: number;
  lng: number;
  city?: string;
};

function searchTerm(q: string): string {
  // map Chinese -> English keywords; otherwise use as-is
  return zhToEn(q) ?? q;
}

async function photon(q: string): Promise<Hit[]> {
  const url = `${PHOTON}?${new URLSearchParams({
    q,
    limit: "15",
    bbox: BBOX,
    lang: "en",
  })}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA }, signal: ctrl.signal });
    if (!r.ok) return [];
    const d = await r.json();
    const feats: any[] = d.features ?? [];
    return feats
      .map((f) => ({
        name: f.properties?.name,
        kind: f.properties?.osm_value || f.properties?.osm_key || "place",
        city: f.properties?.city || f.properties?.locality,
        lng: f.geometry?.coordinates?.[0],
        lat: f.geometry?.coordinates?.[1],
      }))
      .filter((h) => h.name && Number.isFinite(h.lat) && Number.isFinite(h.lng));
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  if (q.length < 2) return Response.json({ results: [] });

  const term = searchTerm(q);
  const hits = await photon(term);

  // de-dup by name+coord, prefer ones inside the Phu Quoc region
  const seen = new Set<string>();
  const results = hits
    .filter((h) => {
      const k = `${h.name}@${h.lat.toFixed(3)},${h.lng.toFixed(3)}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .slice(0, 12);

  return Response.json({ results, term });
}
