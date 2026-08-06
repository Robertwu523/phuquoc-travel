/**
 * Deep-link builders for third-party review / travel-guide platforms.
 * No review API is used (none is freely available); instead we link to each
 * platform's search results for the place name, so the user reads reviews there.
 * Platforms are China-friendly / accessible: Trip.com (携程), Mafengwo (马蜂窝),
 * Xiaohongshu (小红书), plus Google Maps.
 */

export type ReviewLink = {
  key: "trip" | "mafengwo" | "xiaohongshu" | "google";
  label: { zh: string; en: string };
  build: (keyword: string) => string;
};

const CONTEXT = { zh: " 富国岛", en: " Phu Quoc" };

export const reviewLinks: ReviewLink[] = [
  {
    key: "trip",
    label: { zh: "携程点评", en: "Trip.com" },
    build: (k) => `https://www.trip.com/web/search/all?keyword=${encodeURIComponent(k)}`,
  },
  {
    key: "mafengwo",
    label: { zh: "马蜂窝攻略", en: "Mafengwo" },
    build: (k) => `https://www.mafengwo.cn/search/q.php?q=${encodeURIComponent(k)}`,
  },
  {
    key: "xiaohongshu",
    label: { zh: "小红书笔记", en: "Xiaohongshu" },
    build: (k) => `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(k)}`,
  },
  {
    key: "google",
    label: { zh: "Google 地图", en: "Google Maps" },
    build: (k) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(k)}`,
  },
];

/** Build all review links for a place, appending locale context for precision. */
export function buildReviewLinks(
  name: string,
  locale: "zh" | "en"
): { key: ReviewLink["key"]; label: string; url: string }[] {
  const keyword = `${name}${CONTEXT[locale]}`;
  return reviewLinks.map((l) => ({
    key: l.key,
    label: l.label[locale],
    url: l.build(keyword),
  }));
}
