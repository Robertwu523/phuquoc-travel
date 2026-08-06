/**
 * Real driving routes + travel times via the public OSRM demo server
 * (free, keyless, CORS-enabled). Covers Phu Quoc (roads come from OpenStreetMap).
 * Note: the public server has no SLA and is rate-limited — fine for personal use.
 */

const OSRM_BASE = "https://router.project-osrm.org";

export type LatLng = [number, number]; // [lat, lng]

export type LegInfo = { duration: number; distance: number };
export type RouteResult = {
  ok: boolean;
  /** total driving time in seconds */
  duration: number;
  /** total distance in meters */
  distance: number;
  /** decoded polyline as [lat,lng][] */
  geometry: LatLng[];
  legs: LegInfo[];
  error?: string;
};

function formatCoords(coords: LatLng[]): string {
  // OSRM wants lng,lat pairs separated by ';'
  return coords.map(([lat, lng]) => `${lng},${lat}`).join(";");
}

export async function osrmRoute(stops: LatLng[]): Promise<RouteResult> {
  if (stops.length < 2) {
    return { ok: false, duration: 0, distance: 0, geometry: [], legs: [], error: "need 2+ stops" };
  }
  const url = `${OSRM_BASE}/route/v1/driving/${formatCoords(stops)}?overview=full&geometries=geojson`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const d = await res.json();
    if (d.code !== "Ok" || !d.routes?.length) {
      return { ok: false, duration: 0, distance: 0, geometry: [], legs: [], error: d.message || d.code };
    }
    const r = d.routes[0];
    const geometry: LatLng[] = (r.geometry?.coordinates ?? []).map(
      ([lng, lat]: [number, number]) => [lat, lng]
    );
    const legs: LegInfo[] = (r.legs ?? []).map((l: { duration: number; distance: number }) => ({
      duration: l.duration,
      distance: l.distance,
    }));
    return { ok: true, duration: r.duration, distance: r.distance, geometry, legs };
  } catch (e) {
    return { ok: false, duration: 0, distance: 0, geometry: [], legs: [], error: String(e) };
  }
}

export type TripResult = {
  ok: boolean;
  /** optimized stop order, as the input indices reordered */
  order: number[];
  duration: number;
  distance: number;
  geometry: LatLng[];
  error?: string;
};

/**
 * OSRM /trip solves the TSP (Traveling Salesman Problem) over the stops and
 * returns a suggested visiting order that minimizes total travel time.
 * `source=first` keeps the first stop as the start; the rest are reordered.
 */
export async function osrmOptimizeTrip(
  stops: LatLng[],
  opts: { fixedStart?: boolean } = {}
): Promise<TripResult> {
  if (stops.length < 2) {
    return { ok: false, order: stops.map((_, i) => i), duration: 0, distance: 0, geometry: [] };
  }
  const params = new URLSearchParams({
    overview: "full",
    geometries: "geojson",
    roundtrip: "false",
    source: opts.fixedStart === false ? "any" : "first",
    destination: "any",
  });
  const url = `${OSRM_BASE}/trip/v1/driving/${formatCoords(stops)}?${params.toString()}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const d = await res.json();
    if (d.code !== "Ok" || !d.trips?.length) {
      return { ok: false, order: stops.map((_, i) => i), duration: 0, distance: 0, geometry: [], error: d.message || d.code };
    }
    const t = d.trips[0];
    const geometry: LatLng[] = (t.geometry?.coordinates ?? []).map(
      ([lng, lat]: [number, number]) => [lat, lng]
    );
    // Each waypoint in the response corresponds to one input coordinate (by
    // array position). `waypoint_index` is that input's position in the trip.
    // Sort by trip position to recover the optimized visiting order of inputs.
    const order: number[] = (d.waypoints ?? [])
      .map((w: { waypoint_index: number }, i: number) => ({ input: i, pos: w.waypoint_index }))
      .sort((a: { pos: number }, b: { pos: number }) => a.pos - b.pos)
      .map((x: { input: number }) => x.input);
    return {
      ok: true,
      order,
      duration: t.duration,
      distance: t.distance,
      geometry,
    };
  } catch (e) {
    return { ok: false, order: stops.map((_, i) => i), duration: 0, distance: 0, geometry: [], error: String(e) };
  }
}

export function formatDuration(seconds: number): string {
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem ? `${h}h ${rem}m` : `${h}h`;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}
