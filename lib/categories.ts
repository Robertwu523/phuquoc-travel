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

/** Styles for the non-activity item types (transport/hotel/food/note). */
export const ITEM_TYPE_STYLES: Record<string, CategoryStyle> = {
  transport: { color: "#3b82f6", emoji: "🚕" },
  hotel: { color: "#8b5cf6", emoji: "🏨" },
  food: { color: "#f59e0b", emoji: "🍽️" },
  note: { color: "#6b7280", emoji: "📝" },
};

/** Style for any category (known PoiCategory or a user-typed custom string). */
export function styleFor(cat: string): CategoryStyle {
  return (categoryStyles as Record<string, CategoryStyle>)[cat] ?? CUSTOM_STYLE;
}

/** Style for a timeline item: activity items use their POI/custom category color,
 *  other types use the fixed ITEM_TYPE_STYLES. */
export function itemStyle(type: string, category?: string): CategoryStyle {
  if (type === "activity") return category ? styleFor(category) : CUSTOM_STYLE;
  return ITEM_TYPE_STYLES[type] ?? CUSTOM_STYLE;
}
