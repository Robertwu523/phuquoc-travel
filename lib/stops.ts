import { pois, poiById, type POI, type PoiCategory } from "@/data/pois";
import { categoryStyles, styleFor } from "@/lib/categories";

export type StopCategory = PoiCategory | "custom";
export type Locale = "zh" | "en";

/** Kinds of entries that can appear in a day's timeline. */
export type ItemType = "activity" | "transport" | "hotel" | "food" | "note";

/** A single entry in a day's plan. activity items may reference a curated POI / custom pin. */
export type TripItem = {
  id: string;
  type: ItemType;
  title: string;
  /** HH:MM start time, optional */
  time?: string;
  /** duration in hours, optional */
  duration?: number;
  note?: string;
  cost?: { amount: number; currency: "VND" | "HKD" | "USD" | "CNY" };
  /** present when this item is tied to a curated POI or custom pin (keeps map in sync) */
  poiId?: string;
  lat?: number;
  lng?: number;
  emoji?: string;
};

/** A user-added place, stored in the trip store and shown in the catalog. */
export type CustomPin = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  duration: number; // suggested visit hours
  category: string; // a known PoiCategory or a user-typed custom category
  info?: string; // optional description / recognized region
};

/** Normalized render-time representation of any stop (curated or custom). */
export type MapStop = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category: string;
  emoji: string;
  color: string;
  duration: number;
  isCurated: boolean;
};

export function poiToMapStop(poi: POI, locale: Locale): MapStop {
  const s = categoryStyles[poi.category];
  return {
    id: poi.id,
    name: poi.name[locale],
    lat: poi.lat,
    lng: poi.lng,
    category: poi.category,
    emoji: s.emoji,
    color: s.color,
    duration: poi.duration,
    isCurated: true,
  };
}

export function customToMapStop(pin: CustomPin): MapStop {
  const style = styleFor(pin.category);
  return {
    id: pin.id,
    name: pin.name,
    lat: pin.lat,
    lng: pin.lng,
    category: pin.category,
    emoji: style.emoji,
    color: style.color,
    duration: pin.duration,
    isCurated: false,
  };
}

/** Resolve a day-assignment id (curated POI id or custom pin id) to a MapStop. */
export function resolveStop(
  id: string,
  customPins: Record<string, CustomPin>,
  locale: Locale
): MapStop | null {
  const poi = poiById.get(id);
  if (poi) return poiToMapStop(poi, locale);
  const pin = customPins[id];
  if (pin) return customToMapStop(pin);
  return null;
}

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * If the given point is within `thresholdKm` of a curated POI, return that POI
 * (so a dropped pin snaps to a known place and inherits its name + details).
 */
export function snapToCurated(
  lat: number,
  lng: number,
  thresholdKm = 1
): POI | null {
  let best: POI | null = null;
  let bestD = Infinity;
  for (const p of pois) {
    const d = haversineKm(lat, lng, p.lat, p.lng);
    if (d < bestD) {
      bestD = d;
      best = p;
    }
  }
  return best && bestD <= thresholdKm ? best : null;
}
