/**
 * Reverse geocoding via BigdataCloud's free, keyless, browser-CORS endpoint.
 * Gives region-level recognition (country / island / locality). It does NOT
 * resolve specific business or POI names — for that we snap to curated POIs by
 * distance (see lib/stops.ts) or let the user type a name.
 */

export type GeocodeResult = {
  name: string;
  info?: string;
  plusCode?: string;
  country?: string;
  region?: string;
  city?: string;
};

export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<GeocodeResult> {
  const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=zh`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`geocode HTTP ${res.status}`);
  const d = await res.json();

  const city = d.city || d.locality || d.principalSubdivision;
  const country = d.countryName;
  const region = d.principalSubdivision;
  const name = [city, country].filter(Boolean).join(", ");

  return { name: name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`, plusCode: d.plusCode, country, region, city };
}

/**
 * Rich reverse geocode: prefer OSM Overpass (via /api/place) for specific place
 * names — it has good Vietnam coverage. Falls back to BigdataCloud region-level
 * if Overpass fails or finds nothing.
 */
export async function reverseGeocodeRich(
  lat: number,
  lng: number,
  _lang: "zh" | "en" = "zh"
): Promise<GeocodeResult> {
  try {
    const r = await fetch(`/api/place?lat=${lat}&lng=${lng}`);
    if (r.ok) {
      const d = await r.json();
      if (d?.name) return { name: d.name, info: d.info };
    }
  } catch {
    /* fall through */
  }
  return reverseGeocode(lat, lng);
}

