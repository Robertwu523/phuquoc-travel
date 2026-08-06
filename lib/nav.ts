/**
 * One-click "navigate this route" deep link to Google Maps.
 * Built from the day's ordered stops. Supports multi-waypoint directions
 * (up to 9 waypoints) — no API/key needed, just a public deep link.
 */

export type NavStop = { lat: number; lng: number; name?: string };

export function googleNavUrl(stops: NavStop[]): string {
  if (stops.length < 2) return "https://www.google.com/maps";
  const first = stops[0];
  const last = stops[stops.length - 1];
  const params = new URLSearchParams({
    api: "1",
    origin: `${first.lat},${first.lng}`,
    destination: `${last.lat},${last.lng}`,
    travelmode: "driving",
  });
  // intermediate stops as waypoints (Google: lat,lng joined by '|')
  const middle = stops.slice(1, -1).map((s) => `${s.lat},${s.lng}`).join("|");
  if (middle) params.set("waypoints", middle);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

