import type { PoiCategory } from "@/data/pois";

export type RouteTemplate = {
  id: string;
  title: string;
  subtitle: string;
  days: number;
  theme: string;
  emoji: string;
  image: string;
  description: string; // ≤20 chars
  schedule: { day: number; poiIds: string[]; note: string }[];
};

export const routeTemplates: RouteTemplate[] = [
  {
    id: "beach-3d",
    title: "3 天海滩休闲",
    subtitle: "富国岛精华海滩 + 日落 + 夜市",
    days: 3,
    theme: "自然风光",
    emoji: "🏖️",
    image: "/images/phuquoc-sunset.jpg",
    description: "白沙滩、日落、海鲜夜市",
    schedule: [
      { day: 0, poiIds: ["sao-beach", "kem-beach"], note: "南面两大海滩，游泳拍照" },
      { day: 1, poiIds: ["hon-thom-cable-car", "duong-dong-night-market"], note: "缆车 + 阳东夜市海鲜" },
      { day: 2, poiIds: ["rach-vem", "dinh-cau-temple"], note: "海星沙滩 + Dinh Cậu 庙日落" },
    ],
  },
  {
    id: "deep-5d",
    title: "5 天深度探索",
    subtitle: "海滩 + 出海 + 文化 + 美食全覆盖",
    days: 5,
    theme: "小长假深度游",
    emoji: "🧭",
    image: "/images/phuquoc-cablecar.jpg",
    description: "海滩、跳岛、缆车、文化、美食",
    schedule: [
      { day: 0, poiIds: ["sao-beach", "duong-dong-night-market"], note: "星星沙滩 + 夜市" },
      { day: 1, poiIds: ["an-thoi-archipelago", "may-rut-island"], note: "安泰群岛跳岛浮潜一日游" },
      { day: 2, poiIds: ["hon-thom-cable-car", "vinwonders"], note: "缆车 + VinWonders 亲子日" },
      { day: 3, poiIds: ["phu-quoc-national-park", "suoi-tranh-waterfall"], note: "国家公园徒步 + 瀑布" },
      { day: 4, poiIds: ["fish-sauce-factory", "pepper-farm", "dinh-cau-temple"], note: "鱼露工厂 + 胡椒园 + 日落" },
    ],
  },
  {
    id: "family-7d",
    title: "7 天亲子度假",
    subtitle: "慢节奏亲子 + 主题乐园 + 海滩",
    days: 7,
    theme: "亲子",
    emoji: "👨‍👩‍👧",
    image: "/images/phuquoc-vinwonders.jpg",
    description: "亲子乐园、海滩、出海、慢生活",
    schedule: [
      { day: 0, poiIds: ["kem-beach", "duong-dong-night-market"], note: "到达 + 海滩放松 + 夜市" },
      { day: 1, poiIds: ["vinwonders"], note: "VinWonders 全天" },
      { day: 2, poiIds: ["sao-beach"], note: "星星沙滩戏水" },
      { day: 3, poiIds: ["hon-thom-cable-car"], note: "跨海缆车" },
      { day: 4, poiIds: ["an-thoi-archipelago"], note: "跳岛浮潜" },
      { day: 5, poiIds: ["rach-vem", "fish-sauce-factory"], note: "海星沙滩 + 鱼露工厂参观" },
      { day: 6, poiIds: ["phu-quoc-national-park", "dinh-cau-temple"], note: "国家公园 + 海边庙日落" },
    ],
  },
  {
    id: "foodie-4d",
    title: "4 天美食探店",
    subtitle: "海鲜 + 夜市 + 鱼露 + 胡椒",
    days: 4,
    theme: "美食探店",
    emoji: "🍜",
    image: "/images/phuquoc-boats.jpg",
    description: "夜市海鲜、鱼露、胡椒园",
    schedule: [
      { day: 0, poiIds: ["duong-dong-night-market", "dinh-cau-temple"], note: "阳东夜市海鲜大排档" },
      { day: 1, poiIds: ["fish-sauce-factory", "sao-beach"], note: "鱼露工厂 + 星星沙滩" },
      { day: 2, poiIds: ["pepper-farm", "kem-beach"], note: "胡椒园 + Kem 沙滩" },
      { day: 3, poiIds: ["rach-vem", "coconut-prison"], note: "海星沙滩海鲜 + 监狱历史" },
    ],
  },
];
