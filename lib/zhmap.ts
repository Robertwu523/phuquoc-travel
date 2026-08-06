// Lightweight Chinese → English search-term mapping for Phu Quoc place search.
// OSM names in Vietnam are mostly Vietnamese/English, so a Chinese query won't
// match. This maps common Chinese travel keywords to their English equivalents
// so users can type 中文 and still search ALL OSM places (not just curated).
// It is keyword-based (not full machine translation) but covers the common cases.

// Order matters: longer phrases first so "夜市" wins over "市", "国家公园" over "公园".
const MAP: [string, string][] = [
  ["主题乐园", "theme park"],
  ["水上乐园", "water park"],
  ["国家公园", "national park"],
  ["观景台", "viewpoint"],
  ["度假村", "resort"],
  ["便利店", "convenience store"],
  ["纪念品", "souvenir"],
  ["兑换", "currency exchange"],
  ["取款", "atm"],
  ["加油站", "fuel station"],
  ["停车场", "parking"],
  ["派出所", "police"],
  ["摩托车", "motorcycle rental"],
  ["租车", "car rental"],
  ["浮潜", "snorkeling"],
  ["潜水", "diving"],
  ["跳岛", "island hopping"],
  ["出海", "boat tour"],
  ["日落", "sunset viewpoint"],
  ["沙洲", "sandbar"],
  ["灯塔", "lighthouse"],
  ["博物馆", "museum"],
  ["监狱", "prison"],
  ["瀑布", "waterfall"],
  ["缆车", "cable car"],
  ["水族馆", "aquarium"],
  ["夜市", "night market"],
  ["市场", "market"],
  ["沙滩", "beach"],
  ["海滩", "beach"],
  ["海滨", "beach"],
  ["海湾", "bay"],
  ["寺庙", "temple"],
  ["教堂", "church"],
  ["森林", "forest"],
  ["观景", "viewpoint"],
  ["农场", "farm"],
  ["工厂", "factory"],
  ["餐厅", "restaurant"],
  ["餐馆", "restaurant"],
  ["美食", "restaurant"],
  ["海鲜", "seafood"],
  ["烧烤", "grill"],
  ["越南粉", "pho"],
  ["河粉", "noodle"],
  ["米粉", "noodle"],
  ["咖啡", "cafe"],
  ["酒吧", "bar"],
  ["啤酒", "beer"],
  ["甜点", "dessert"],
  ["冰淇淋", "ice cream"],
  ["超市", "supermarket"],
  ["酒店", "hotel"],
  ["宾馆", "hotel"],
  ["旅馆", "hotel"],
  ["民宿", "guesthouse"],
  ["客栈", "guesthouse"],
  ["别墅", "villa"],
  ["按摩", "massage"],
  ["机场", "airport"],
  ["港口", "pier"],
  ["码头", "pier"],
  ["渡口", "pier"],
  ["警察", "police"],
  ["医院", "hospital"],
  ["药店", "pharmacy"],
  ["药房", "pharmacy"],
  ["邮局", "post office"],
  ["学校", "school"],
  ["礼品", "gift"],
  ["珍珠", "pearl"],
  ["鱼露", "fish sauce"],
  ["胡椒", "pepper farm"],
  ["温泉", "hot spring"],
  ["山顶", "peak"],
  ["山峰", "peak"],
  ["公园", "park"],
  ["药店", "pharmacy"],
];

const CJK = /[一-鿿]/;

/**
 * If the query contains Chinese, return English search terms derived from it.
 * Returns null if no Chinese keywords are recognized (caller can then decide).
 */
export function zhToEn(query: string): string | null {
  if (!CJK.test(query)) return null;
  const found: string[] = [];
  let rest = query;
  for (const [zh, en] of MAP) {
    if (rest.includes(zh) && !found.includes(en)) {
      found.push(en);
      rest = rest.split(zh).join(" ");
    }
  }
  return found.length ? found.join(" ") : null;
}
