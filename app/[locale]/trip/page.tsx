"use client";

import { useTranslations } from "next-intl";
import { useTripStore, selectTotalPois } from "@/lib/store";
import DayTimeline from "@/components/DayTimeline";
import PageHero from "@/components/PageHero";
import { Link } from "@/i18n/navigation";

const WEEK = ["日", "一", "二", "三", "四", "五", "六"];

function fmtDate(d: Date) {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function Page() {
  const tp = useTranslations("Planner");
  const h = useTranslations("Home");
  const hydrated = useTripStore((s) => s._hasHydrated);
  const days = useTripStore((s) => s.days);
  const startDate = useTripStore((s) => s.startDate);
  const setStartDate = useTripStore((s) => s.setStartDate);
  const setDays = useTripStore((s) => s.setDays);
  const clearAll = useTripStore((s) => s.clearAll);
  const total = useTripStore(selectTotalPois);

  const dayArr = Array.from({ length: days }, (_, i) => i);

  let rangeStr: string | null = null;
  let weekdayStr: string | null = null;
  if (startDate) {
    const s = new Date(`${startDate}T00:00:00`);
    if (!Number.isNaN(s.getTime())) {
      const e = new Date(s);
      e.setDate(e.getDate() + days - 1);
      rangeStr = days > 1 ? `${fmtDate(s)} – ${fmtDate(e)}` : fmtDate(s);
      weekdayStr = `周${WEEK[s.getDay()]}`;
    }
  }

  return (
    <>
      <PageHero
        image="/images/phuquoc-sea.jpg"
        eyebrow="ITINERARY"
        title={tp("title")}
        subtitle={h("tripDesc")}
      />

      <div className="mx-auto max-w-3xl space-y-5 px-4 py-10">
        {!hydrated ? (
          <div className="h-40 animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-800/60" />
        ) : (
          <>
            {/* summary + controls */}
            <div className="rounded-[20px] border border-slate-200 bg-gradient-to-br from-[#FFB088] to-[#FF7A45] p-6 text-white shadow-sm">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/75">
                    富国岛行程
                  </div>
                  <div className="mt-1 text-3xl font-extrabold">
                    {rangeStr ?? "待定日期"}{" "}
                    {weekdayStr && <span className="text-base font-medium text-white/80">{weekdayStr}</span>}
                  </div>
                  <div className="mt-1 text-sm text-white/85">
                    {days} 天 · {total} 个景点
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex flex-col text-[10px] font-semibold uppercase tracking-wider text-white/80">
                    出发
                    <input
                      type="date"
                      value={startDate ?? ""}
                      onChange={(e) => setStartDate(e.target.value || null)}
                      className="mt-1 rounded-md border border-white/40 bg-white/15 px-2 py-1.5 text-sm text-white backdrop-blur focus:outline-none [color-scheme:light]"
                    />
                  </label>
                  <label className="flex flex-col text-[10px] font-semibold uppercase tracking-wider text-white/80">
                    天数
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={days}
                      onChange={(e) => setDays(Number(e.target.value))}
                      className="mt-1 w-16 rounded-md border border-white/40 bg-white/15 px-2 py-1.5 text-sm text-white backdrop-blur focus:outline-none"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={clearAll}
                    className="mt-4 rounded-md border border-white/50 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/15"
                  >
                    {tp("clearAll")}
                  </button>
                </div>
              </div>
            </div>

            {/* day timelines */}
            {dayArr.map((i) => (
              <DayTimeline key={i} day={i} />
            ))}

            {/* empty cta */}
            {total === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-700">
                <p className="text-sm text-slate-500">还没有安排景点。</p>
                <Link
                  href="/map"
                  className="mt-3 inline-block rounded-full bg-[#FF7A45] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#e6662e]"
                >
                  去地图选点 →
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
