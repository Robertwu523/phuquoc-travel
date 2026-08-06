/**
 * Flight redirect (deep-link) helpers for HKG -> PQC.
 *
 * No live price API is used (Amadeus Self-Service was decommissioned and Ctrip
 * has no free public price API). Instead we build deep-links to booking
 * platforms that show live inventory and prices when the user lands on them.
 */

const ORIGIN = "HKG";
const DEST = "PQC";

export type FlightQuery = {
  departDate: string; // ISO yyyy-mm-dd
  returnDate?: string; // ISO yyyy-mm-dd (omitted for one-way)
  adults?: number;
};

/** "2026-11-20" -> "261120" (Skyscanner's YYMMDD format) */
function toYYMMDD(iso: string): string {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return "";
  return `${y.slice(2)}${m}${d}`;
}

function withAdults(base?: number): number {
  return Math.max(1, Math.min(9, Math.round(base || 1)));
}

/** Trip.com / 携程 (HK site). oneway=N for round trip, =Y for one way. */
export function tripcomUrl(q: FlightQuery): string {
  const adults = withAdults(q.adults);
  const oneway = q.returnDate ? "N" : "Y";
  const params = new URLSearchParams({
    oneway,
    depAirport: ORIGIN,
    arrAirport: DEST,
    depDate: q.departDate,
    cabin: "y",
    adult: String(adults),
    child: "0",
    infant: "0",
  });
  if (q.returnDate) params.set("retDate", q.returnDate);
  return `https://hk.trip.com/flights/showfaresearch?${params.toString()}`;
}

/** Skyscanner. Uses YYMMDD dates. One segment = one-way, two = round trip. */
export function skyscannerUrl(q: FlightQuery): string {
  const dep = toYYMMDD(q.departDate);
  if (!dep) return "https://www.skyscanner.com";
  const adults = withAdults(q.adults);
  const path = q.returnDate
    ? `/transport/flights/hkg/pqc/${dep}/${toYYMMDD(q.returnDate)}/`
    : `/transport/flights/hkg/pqc/${dep}/`;
  const params = new URLSearchParams({
    adultsv2: String(adults),
    cabinclass: "economy",
    preferdirects: "true",
  });
  return `https://www.skyscanner.com${path}?${params.toString()}`;
}

/** Google Flights. Natural-query URL — robust and accepts both one-way & round trip. */
export function googleFlightsUrl(q: FlightQuery): string {
  const adults = withAdults(q.adults);
  const tripPart = q.returnDate
    ? `from ${ORIGIN} to ${DEST} on ${q.departDate} through ${q.returnDate}`
    : `from ${ORIGIN} to ${DEST} on ${q.departDate}`;
  const query = `one-way and round-trip flights ${tripPart} ${adults} passenger${adults > 1 ? "s" : ""}`;
  return `https://www.google.com/travel/flights?q=${encodeURIComponent(query)}`;
}

export type FlightLink = {
  key: "tripcom" | "skyscanner" | "google";
  labelKey: "searchCtrip" | "searchSkyscanner" | "searchGoogle";
  url: (q: FlightQuery) => string;
};

export const flightLinks: FlightLink[] = [
  { key: "tripcom", labelKey: "searchCtrip", url: tripcomUrl },
  { key: "skyscanner", labelKey: "searchSkyscanner", url: skyscannerUrl },
  { key: "google", labelKey: "searchGoogle", url: googleFlightsUrl },
];

/** Add N days to an ISO yyyy-mm-dd string, return ISO yyyy-mm-dd. */
export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return "";
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Today's date as ISO yyyy-mm-dd, in case nothing is set yet. */
export function defaultDepartDate(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}
