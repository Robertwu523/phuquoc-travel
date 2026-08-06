export type PoiCategory =
  | "beach"
  | "family"
  | "nature"
  | "island"
  | "market"
  | "temple"
  | "culture";

export type Localized = { zh: string; en: string };

export type POI = {
  id: string;
  category: PoiCategory;
  name: Localized;
  description: Localized;
  lat: number;
  lng: number;
  /** suggested visit duration in hours */
  duration: number;
};

// Coordinates: most are from open mapping sources / travel references. Some are
// verified against OpenStreetMap (night market, prison, fish-sauce factory) and
// Sao Beach was corrected (it sits on the SE coast, not the north). Eye-ball the
// rest on the map and nudge any marker that drifts.
export const pois: POI[] = [
  {
    id: "sao-beach",
    category: "beach",
    name: { zh: "星星沙滩", en: "Sao Beach" },
    description: {
      zh: "富国岛最著名的白沙滩，水浅浪平，适合游泳和拍照。东南海岸，周边有度假村和水上活动。",
      en: "Phu Quoc's iconic white-sand beach. Shallow, calm water — great for swimming and photos. On the southeast coast with resorts and water sports nearby.",
    },
    lat: 10.0524,
    lng: 104.0352,
    duration: 3,
  },
  {
    id: "kem-beach",
    category: "beach",
    name: { zh: "Kem 沙滩", en: "Kem Beach" },
    description: {
      zh: "西南侧宁静沙滩，日落绝美，比星星沙滩人少。日落时分尤其推荐。",
      en: "A quieter beach on the southwest with stunning sunsets and fewer crowds than Sao. Especially lovely at dusk.",
    },
    lat: 10.0356,
    lng: 104.0176,
    duration: 2,
  },
  {
    id: "rach-vem",
    category: "beach",
    name: { zh: "海星沙滩 (Rach Vem)", en: "Rach Vem Starfish Beach" },
    description: {
      zh: "西北海岸的浅滩，成群海星近岸。旱季最佳。请勿把海星拿出水面。",
      en: "Shallow northwest shore famous for starfish near the water's edge. Best in dry season. Please don't lift starfish out of the water.",
    },
    lat: 10.275,
    lng: 103.865,
    duration: 2,
  },
  {
    id: "vinwonders",
    category: "family",
    name: { zh: "珍珠游乐园 VinWonders", en: "VinWonders Phu Quoc" },
    description: {
      zh: "越南最大的主题乐园之一：过山车、水族馆、水上乐园、摩天轮，亲子一日游首选。",
      en: "One of Vietnam's largest theme parks: roller coasters, aquarium, water park and a Ferris wheel. The top family day out.",
    },
    lat: 10.243,
    lng: 103.975,
    duration: 6,
  },
  {
    id: "hon-thom-cable-car",
    category: "family",
    name: { zh: "香岛跨海缆车", en: "Hon Thom Cable Car" },
    description: {
      zh: "吉尼斯世界纪录最长的跨海缆车（近 8 公里），往返安泰群岛与香岛，俯瞰碧海。终点是 Sun World 自然公园与水上乐园。",
      en: "Guinness-certified longest over-sea cable car (nearly 8 km) linking the An Thoi area to Hon Thom island, with panoramic sea views. Ends at the Sun World nature park and water park.",
    },
    lat: 10.002,
    lng: 103.988,
    duration: 4,
  },
  {
    id: "phu-quoc-national-park",
    category: "nature",
    name: { zh: "富国岛国家公园", en: "Phu Quoc National Park" },
    description: {
      zh: "占岛过半面积的雨林保护区，徒步、观鸟、看原生林与溪流。多条步道可选，请向导同行。",
      en: "A rainforest reserve covering more than half the island — hiking, birdwatching, old-growth forest and streams. Several trails; go with a guide.",
    },
    lat: 10.15,
    lng: 104.07,
    duration: 4,
  },
  {
    id: "suoi-tranh-waterfall",
    category: "nature",
    name: { zh: "Suoi Tranh 瀑布", en: "Suoi Tranh Waterfall" },
    description: {
      zh: "岛中部的小型瀑布与溪谷，雨季水量大。可戏水、散步，周边有步道。",
      en: "A small waterfall and stream valley in the island's interior, best in the rainy season. Paddle, stroll and walk the surrounding trails.",
    },
    lat: 10.1838,
    lng: 104.0153,
    duration: 2,
  },
  {
    id: "an-thoi-archipelago",
    category: "island",
    name: { zh: "安泰群岛", en: "An Thoi Archipelago" },
    description: {
      zh: "南部 15 座小岛群，浮潜、深潜、跳岛一日游的热门目的地。水晶岛、珊瑚礁丰富。",
      en: "A cluster of 15 islets in the south — the go-to for snorkeling, diving and island-hopping day trips. Crystal water and rich coral.",
    },
    lat: 9.92,
    lng: 104.0,
    duration: 7,
  },
  {
    id: "may-rut-island",
    category: "island",
    name: { zh: "May Rut 岛", en: "May Rut Island" },
    description: {
      zh: "安泰群岛中的明星小岛，白沙清水，有简易餐饮。浮潜和躺平一日游好去处。",
      en: "A star islet of the An Thoi group — white sand, clear water and basic food stalls. Perfect for a snorkel-and-chill day trip.",
    },
    lat: 9.9114,
    lng: 103.9897,
    duration: 5,
  },
  {
    id: "duong-dong-night-market",
    category: "market",
    name: { zh: "阳东夜市", en: "Duong Dong Night Market" },
    description: {
      zh: "岛上最热闹的夜市，海鲜大排档、烤鱿鱼、当地小吃。晚餐和感受市井气息的首选。",
      en: "The island's liveliest night market: seafood stalls, grilled squid and local snacks. The top dinner spot and a taste of local life.",
    },
    lat: 10.2163,
    lng: 103.96058,
    duration: 2,
  },
  {
    id: "dinh-cau-temple",
    category: "temple",
    name: { zh: "Dinh Cậu 庙", en: "Dinh Cau Temple" },
    description: {
      zh: "建在海边礁石上的百年小庙，渔民祈求平安。日落时景色很美，紧邻阳东。",
      en: "A century-old shrine on a seaside rock where fishermen pray for safe voyages. Lovely at sunset, right by Duong Dong.",
    },
    lat: 10.2172,
    lng: 103.9564,
    duration: 1,
  },
  {
    id: "coconut-prison",
    category: "culture",
    name: { zh: "富国岛监狱旧址", en: "Coconut Prison (Phu Quoc Prison)" },
    description: {
      zh: "越战时期的战俘营遗址，现为历史纪念馆。内容较沉重，适合对历史感兴趣的游客。",
      en: "A Vietnam War-era POW camp turned history museum. sobering content; suited to visitors interested in history.",
    },
    lat: 10.04226,
    lng: 104.01694,
    duration: 2,
  },
  {
    id: "fish-sauce-factory",
    category: "culture",
    name: { zh: "鱼露工厂", en: "Fish Sauce Factory" },
    description: {
      zh: "富国岛鱼露是越南名产，可在工厂（如 Khai Hoan）参观传统发酵工艺并购买。气味浓烈。",
      en: "Phu Quoc fish sauce is a Vietnamese flagship. Tour a factory (e.g. Khai Hoan) to see traditional fermentation and buy some. Pungent smell.",
    },
    lat: 10.21995,
    lng: 103.9715,
    duration: 1,
  },
  {
    id: "pepper-farm",
    category: "culture",
    name: { zh: "胡椒园", en: "Pepper Farm" },
    description: {
      zh: "富国岛黑胡椒闻名，园内可了解种植、采摘并选购。旱季（2-5 月）能看到采摘。",
      en: "Phu Quoc's black pepper is renowned. Learn about growing and harvesting, and buy some. Harvest visible in dry season (Feb-May).",
    },
    lat: 10.2494,
    lng: 104.0202,
    duration: 1,
  },
];

export const poiById = new Map(pois.map((p) => [p.id, p]));
