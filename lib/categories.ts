import type { PoiCategory } from "@/data/pois";

export type CategoryStyle = {
  /** marker / accent color */
  color: string;
  /** emoji used in markers and the filter bar */
  emoji: string;
};

export const categoryStyles: Record<PoiCategory, CategoryStyle> = {
  beach: { color: "#0ea5e9", emoji: "🏖️" },
  family: { color: "#f59e0b", emoji: "🎡" },
  nature: { color: "#16a34a", emoji: "🌳" },
  island: { color: "#06b6d4", emoji: "🚤" },
  market: { color: "#ef4444", emoji: "🍜" },
  temple: { color: "#a855f7", emoji: "🛕" },
  culture: { color: "#8b5cf6", emoji: "🫙" },
};

/** Default style for user-defined categories (anything not in the fixed set). */
export const CUSTOM_STYLE: CategoryStyle = { color: "#db2777", emoji: "📍" };

/** Style for any category (known PoiCategory or a user-typed custom string). */
export function styleFor(cat: string): CategoryStyle {
  return (categoryStyles as Record<string, CategoryStyle>)[cat] ?? CUSTOM_STYLE;
}
