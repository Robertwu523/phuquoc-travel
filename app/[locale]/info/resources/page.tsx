import PageHero from "@/components/PageHero";

type Site = { name: string; url: string; note: string; cn: boolean };
type Group = { emoji: string; name: string; sites: Site[] };

const GROUPS: Group[] = [
  {
    emoji: "📖",
    name: "攻略 & 游记",
    sites: [
      { name: "马蜂窝", url: "https://www.mafengwo.cn", note: "国内最全的攻略和游记，目的地信息全", cn: true },
      { name: "穷游网", url: "https://www.qyer.com", note: "出境游锦囊 + 行程助手，质量高", cn: true },
      { name: "TripAdvisor", url: "https://www.tripadvisor.com", note: "全球最大点评站，查餐厅/景点评价最靠谱", cn: false },
      { name: "小红书", url: "https://www.xiaohongshu.com", note: "富国岛实地笔记/避坑，图文多", cn: true },
    ],
  },
  {
    emoji: "✈️",
    name: "机票 & 比价",
    sites: [
      { name: "Skyscanner 天巡", url: "https://www.skyscanner.com", note: "全球机票比价，可搜「整月最便宜」", cn: false },
      { name: "Google Flights", url: "https://www.google.com/travel/flights", note: "价格趋势 + 灵活日期搜索很强", cn: false },
      { name: "去哪儿", url: "https://www.qunar.com", note: "国内平台，促销价有时更便宜", cn: true },
      { name: "飞猪", url: "https://www.fliggy.com", note: "阿里系，机票+酒店套餐多", cn: true },
    ],
  },
  {
    emoji: "🏨",
    name: "酒店 & 住宿",
    sites: [
      { name: "Booking.com", url: "https://www.booking.com", note: "全球酒店，多数可免费取消", cn: false },
      { name: "Agoda", url: "https://www.agoda.com", note: "东南亚价格常比 Booking 低", cn: false },
      { name: "Airbnb", url: "https://www.airbnb.com", note: "民宿短租，适合多人出行/长住", cn: false },
      { name: "Hostelworld", url: "https://www.hostelworld.com", note: "青旅预订，背包客必备", cn: false },
    ],
  },
  {
    emoji: "🗺️",
    name: "地图 & 导航",
    sites: [
      { name: "Google Maps", url: "https://www.google.com/maps", note: "国外导航首选，支持离线地图 + 公交", cn: false },
      { name: "Citymapper", url: "https://citymapper.com", note: "城市公交导航，欧美大城市特别准", cn: false },
      { name: "Rome2Rio", url: "https://www.rome2rio.com", note: "两地间所有交通方式（机/火车/大巴/自驾）+ 价格对比", cn: false },
    ],
  },
  {
    emoji: "📅",
    name: "行程规划",
    sites: [
      { name: "TripIt", url: "https://www.tripit.com", note: "把机票酒店确认邮件自动整理成行程单", cn: false },
      { name: "Notion", url: "https://www.notion.so", note: "自定义行程表，灵活好用", cn: false },
      { name: "飞书文档", url: "https://www.feishu.cn", note: "国内可用，多人协作做行程表", cn: true },
    ],
  },
];

export default function ResourcesPage() {
  return (
    <>
      <PageHero
        image="/images/phuquoc-sea.jpg"
        eyebrow="TRAVEL TOOLS"
        title="旅行工具与资源"
        subtitle="按用途分类的实用旅行网站 · 🇨🇳 国内直连 · 🌐 可能需翻墙"
      />

      <div className="mx-auto max-w-5xl space-y-10 px-4 py-12">
        {GROUPS.map((g) => (
          <section key={g.name}>
            <h2 className="flex items-center gap-2 text-xl font-extrabold text-slate-900 dark:text-white">
              <span className="text-2xl">{g.emoji}</span>
              {g.name}
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {g.sites.map((s) => (
                <a
                  key={s.name}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">{s.name}</span>
                    <span
                      className={
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold " +
                        (s.cn
                          ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300")
                      }
                    >
                      {s.cn ? "🇨🇳 直连" : "🌐 翻墙"}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{s.note}</p>
                  <div className="mt-2 text-xs font-medium text-teal-700 dark:text-teal-400">
                    {s.url.replace("https://www.", "").replace("https://", "")} <span className="transition group-hover:translate-x-0.5 inline-block">↗</span>
                  </div>
                </a>
              ))}
            </div>
          </section>
        ))}

        <p className="rounded-xl bg-slate-100 px-4 py-3 text-xs text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
          提示：标注 🇨🇳 的国内可直连；标注 🌐 的境外站点在国内可能需要开 VPN 才能打开。价格/政策以各平台实时为准。
        </p>
      </div>
    </>
  );
}
