"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useTripStore, selectTotalPois } from "@/lib/store";
import { resolveStop, type MapStop, type Locale } from "@/lib/stops";
import { styleFor, categoryStyles } from "@/lib/categories";
import { pois } from "@/data/pois";
import ExploreSection from "@/components/ExploreSection";
import ExpenseTracker from "@/components/ExpenseTracker";
import { Link } from "@/i18n/navigation";

const WEEK = ["日", "一", "二", "三", "四", "五", "六"];
const START_HOUR = 7;  // 07:00
const END_HOUR = 23;   // 23:00
const HOURS = END_HOUR - START_HOUR; // 16 hours
const PX_PER_HOUR = 70; // pixel width per hour
const TIMELINE_WIDTH = HOURS * PX_PER_HOUR;
const TRAVEL_MIN = 30; // default travel gap between stops

const HOUR_LABELS = Array.from({ length: HOURS + 1 }, (_, i) => {
  const h = START_HOUR + i;
  return `${String(h).padStart(2, "0")}:00`;
});

type Tab = "timeline" | "explore" | "expenses";

type NavStop = { lat: number; lng: number; name: string };

function computeSchedule(stops: MapStop[]) {
  let t = 9 * 60; // start at 09:00
  return stops.map((stop) => {
    const start = t;
    const dur = Math.max(30, stop.duration * 60);
    const end = start + dur;
    t = end + TRAVEL_MIN;
    return { stop, startMin: start, endMin: end };
  });
}

function minToLabel(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function minToX(min: number) {
  return ((min - START_HOUR * 60) / 60) * PX_PER_HOUR;
}

/** all pickable stops (curated + custom), filtered by query */
function pickableStops(customPins: Record<string, any>, locale: Locale, q: string) {
  const curated = pois.map((p) => ({ id: p.id, name: p.name[locale], emoji: categoryStyles[p.category]?.emoji ?? "", isCurated: true, lat: p.lat, lng: p.lng }));
  const custom = Object.values(customPins).map((p: any) => ({ id: p.id, name: p.name, emoji: "📍", isCurated: false, lat: p.lat, lng: p.lng }));
  const all = [...curated, ...custom];
  if (!q) return all;
  const lq = q.toLowerCase();
  return all.filter((s) => s.name.toLowerCase().includes(lq));
}

export default function Page() {
  const tp = useTranslations("Planner");
  const locale = useLocale() as Locale;
  const hydrated = useTripStore((s) => s._hasHydrated);
  const days = useTripStore((s) => s.days);
  const startDate = useTripStore((s) => s.startDate);
  const setStartDate = useTripStore((s) => s.setStartDate);
  const setDays = useTripStore((s) => s.setDays);
  const clearAll = useTripStore((s) => s.clearAll);
  const dayAssignments = useTripStore((s) => s.dayAssignments);
  const customPins = useTripStore((s) => s.customPins);
  const removePoiFromDay = useTripStore((s) => s.removePoiFromDay);
  const addPoiToDay = useTripStore((s) => s.addPoiToDay);
  const total = useTripStore(selectTotalPois);
  const [tab, setTab] = useState<Tab>("timeline");
  const [addSlot, setAddSlot] = useState<{ day: number; timeMin: number; x: number; y: number } | null>(null);
  const [addQuery, setAddQuery] = useState("");
  const [hovered, setHovered] = useState<{
    day: number; stopId: string; stopName: string; stopEmoji: string;
    startLabel: string; endLabel: string; duration: number; lat: number; lng: number;
    isCurated: boolean; blockRect: DOMRect;
  } | null>(null);
  const hoverTimer = useRef<NodeJS.Timeout | null>(null);

  const dayArr = Array.from({ length: days }, (_, i) => i);

  let rangeStr = "待定";
  if (startDate) {
    const s = new Date(`${startDate}T00:00:00`);
    if (!Number.isNaN(s.getTime())) {
      const e = new Date(s);
      e.setDate(e.getDate() + days - 1);
      rangeStr = days > 1 ? `${s.getMonth() + 1}/${s.getDate()} – ${e.getMonth() + 1}/${e.getDate()}` : `${s.getMonth() + 1}/${s.getDate()}`;
    }
  }

  function dateForDay(i: number) {
    if (!startDate) return "";
    const d = new Date(`${startDate}T00:00:00`);
    if (Number.isNaN(d.getTime())) return "";
    d.setDate(d.getDate() + i);
    return `${d.getMonth() + 1}/${d.getDate()} 周${WEEK[d.getDay()]}`;
  }

  const TABS: { key: Tab; label: string; emoji: string }[] = [
    { key: "timeline", label: "行程", emoji: "📋" },
    { key: "explore", label: "探索", emoji: "🧭" },
    { key: "expenses", label: "记账", emoji: "💰" },
  ];

  return (
    <div className="pt-16">
      {!hydrated ? (
        <div className="mx-auto max-w-7xl px-4 py-20">
          <div className="h-40 animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-800/60" />
        </div>
      ) : (
        <div className="mx-auto max-w-7xl px-3 py-4">
          {/* summary bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-[#FFB088] to-[#FF7A45] px-5 py-3 text-white">
            <div className="flex items-baseline gap-3">
              <h1 className="text-lg font-extrabold">📋 富国岛行程</h1>
              <span className="text-sm text-white/85">{rangeStr} · {days}天 · {total}个景点</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 text-xs text-white/80">
                出发
                <input type="date" value={startDate ?? ""} onChange={(e) => setStartDate(e.target.value || null)}
                  className="rounded border border-white/40 bg-white/15 px-2 py-1 text-xs text-white focus:outline-none [color-scheme:light]" />
              </label>
              <label className="flex items-center gap-1 text-xs text-white/80">
                天数
                <input type="number" min={1} max={30} value={days} onChange={(e) => setDays(Number(e.target.value))}
                  className="w-14 rounded border border-white/40 bg-white/15 px-1 py-1 text-xs text-white focus:outline-none" />
              </label>
              <button type="button" onClick={clearAll}
                className="rounded border border-white/50 px-2 py-1 text-xs font-semibold transition hover:bg-white/15">
                {tp("clearAll")}
              </button>
            </div>
          </div>

          {/* tabs */}
          <div className="mt-3 flex gap-1 rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
            {TABS.map((tb) => (
              <button key={tb.key} type="button" onClick={() => setTab(tb.key)}
                className={"flex-1 rounded-lg py-2 text-sm font-semibold transition " +
                  (tab === tb.key ? "bg-[#FF7A45] text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:text-slate-400")}>
                {tb.emoji} {tb.label}
              </button>
            ))}
          </div>

          {/* ===== TIMELINE TAB ===== */}
          {tab === "timeline" && (
            <div className="mt-4">
              {total === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-700">
                  <p className="text-sm text-slate-500">还没有安排景点。</p>
                  <div className="mt-3 flex justify-center gap-2">
                    <button type="button" onClick={() => setTab("explore")}
                      className="rounded-full bg-[#FF7A45] px-5 py-2 text-sm font-semibold text-white">
                      探索路线
                    </button>
                    <Link href="/map" className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-600">
                      地图选点
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  {/* hour header */}
                  <div className="flex border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
                    <div className="w-[100px] shrink-0 border-r border-slate-200 px-2 py-1.5 text-[10px] font-bold uppercase text-slate-400 dark:border-slate-700">
                      日期
                    </div>
                    <div className="relative" style={{ width: TIMELINE_WIDTH, minWidth: TIMELINE_WIDTH }}>
                      <div className="flex">
                        {HOUR_LABELS.map((label, i) => (
                          <div key={i} className="text-[9px] text-slate-400" style={{ width: PX_PER_HOUR }}>
                            {label}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* day rows */}
                  {dayArr.map((dayIdx) => {
                    const ids = dayAssignments[dayIdx] ?? [];
                    const stops = ids.map((id) => resolveStop(id, customPins, locale)).filter(Boolean) as MapStop[];
                    const schedule = computeSchedule(stops);
                    const totalMin = schedule.length > 0
                      ? schedule[schedule.length - 1].endMin - schedule[0].startMin
                      : 0;

                    return (
                      <div key={dayIdx} className="flex border-b border-slate-100 dark:border-slate-800">
                        {/* day label */}
                        <div className="w-[100px] shrink-0 border-r border-slate-200 px-2 py-2 dark:border-slate-700">
                          <div className="text-xs font-bold text-slate-900 dark:text-white">第 {dayIdx + 1} 天</div>
                          <div className="text-[10px] text-slate-400">{dateForDay(dayIdx)}</div>
                          <div className="mt-0.5 text-[10px] text-[#FF7A45]">{stops.length} 站</div>
                          {totalMin > 0 && (
                            <div className="text-[9px] text-slate-400">{Math.floor(totalMin / 60)}h{totalMin % 60 ? `${totalMin % 60}m` : ""}</div>
                          )}
                        </div>

                        {/* timeline track */}
                        <div
                          className="relative cursor-pointer"
                          style={{ width: TIMELINE_WIDTH, minWidth: TIMELINE_WIDTH, minHeight: 56 }}
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = e.clientX - rect.left;
                            const timeMin = Math.round((x / PX_PER_HOUR + START_HOUR) * 60 / 30) * 30;
                            if (timeMin >= START_HOUR * 60 && timeMin <= END_HOUR * 60) {
                              setAddSlot({ day: dayIdx, timeMin, x: e.clientX, y: e.clientY });
                              setAddQuery("");
                            }
                          }}
                        >
                          {/* hour grid lines */}
                          {HOUR_LABELS.map((_, i) => (
                            <div key={i} className="absolute top-0 bottom-0 border-l border-slate-100 dark:border-slate-800"
                              style={{ left: i * PX_PER_HOUR }} />
                          ))}

                          {/* stop blocks */}
                          {schedule.map(({ stop, startMin, endMin }) => {
                            const st = styleFor(stop.category);
                            const left = minToX(startMin);
                            const width = Math.max(40, ((endMin - startMin) / 60) * PX_PER_HOUR);
                            return (
                              <div key={stop.id} className="absolute top-1.5 z-10" style={{ left, width }}
                                onMouseEnter={(e) => {
                                  if (hoverTimer.current) clearTimeout(hoverTimer.current);
                                  const r = e.currentTarget.getBoundingClientRect();
                                  setHovered({
                                    day: dayIdx, stopId: stop.id, stopName: stop.name || "",
                                    stopEmoji: stop.emoji, startLabel: minToLabel(startMin),
                                    endLabel: minToLabel(endMin), duration: stop.duration,
                                    lat: stop.lat, lng: stop.lng, isCurated: stop.isCurated, blockRect: r,
                                  });
                                }}
                                onMouseLeave={() => {
                                  hoverTimer.current = setTimeout(() => setHovered(null), 200);
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {/* colored block */}
                                <div
                                  className="flex h-[44px] items-center gap-1 rounded-lg px-1.5 text-white shadow-sm transition hover:brightness-110 hover:shadow-lg"
                                  style={{ background: st.color, width: "100%" }}
                                >
                                  <span className="shrink-0 text-xs">{stop.emoji}</span>
                                  <span className="truncate text-[10px] font-bold">{stop.name}</span>
                                </div>
                              </div>
                            );
                          })}

                          {/* empty hint */}
                          {stops.length === 0 && (
                            <div className="flex h-full items-center justify-center text-[10px] text-slate-300">
                              点击此处添加景点 →
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* floating hover card (rendered once, outside overflow) */}
                  {hovered && (
                    <div
                      className="fixed z-[2000] min-w-[220px] rounded-xl border border-slate-200 bg-white p-3 shadow-xl transition-opacity duration-150 dark:border-slate-700 dark:bg-slate-900"
                      style={{
                        top: hovered.blockRect.bottom + 4,
                        left: hovered.blockRect.left,
                      }}
                      onMouseEnter={() => { if (hoverTimer.current) clearTimeout(hoverTimer.current); }}
                      onMouseLeave={() => setHovered(null)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{hovered.stopEmoji}</span>
                        <div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white">{hovered.stopName}</div>
                          <div className="text-[10px] text-slate-400">{hovered.startLabel} – {hovered.endLabel}</div>
                        </div>
                      </div>
                      <div className="mt-1.5 text-[11px] text-slate-500">⏱ {hovered.duration}h · {hovered.isCurated ? "收录" : "自定义"}</div>
                      <div className="text-[10px] text-slate-400">📍 {hovered.lat.toFixed(4)}, {hovered.lng.toFixed(4)}</div>
                      <div className="mt-2 flex gap-1">
                        <a target="_blank" rel="noopener noreferrer"
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hovered.stopName + " Phu Quoc")}`}
                          className="flex-1 rounded-md bg-slate-100 py-1 text-center text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">评价</a>
                        <a target="_blank" rel="noopener noreferrer"
                          href={`https://www.google.com/maps/dir/?api=1&destination=${hovered.lat},${hovered.lng}`}
                          className="flex-1 rounded-md bg-[#FF7A45] py-1 text-center text-[10px] font-medium text-white">导航</a>
                        <button type="button"
                          onClick={() => { removePoiFromDay(hovered.day, hovered.stopId); setHovered(null); }}
                          className="rounded-md bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-600 dark:bg-red-950/30">✕</button>
                      </div>
                    </div>
                  )}

                  {/* add-stop picker */}
                  {addSlot && (
                    <div className="fixed inset-0 z-[2000] flex items-start justify-center bg-black/20 pt-32"
                      onClick={() => setAddSlot(null)}>
                      <div className="max-h-[360px] w-80 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
                        onClick={(e) => e.stopPropagation()}>
                        <div className="mb-2 text-sm font-bold text-slate-900 dark:text-white">
                          📍 添加景点到第 {addSlot.day + 1} 天 · {minToLabel(addSlot.timeMin)}
                        </div>
                        <input value={addQuery} onChange={(e) => setAddQuery(e.target.value)}
                          placeholder="搜索景点…" autoFocus
                          className="mb-2 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#FF7A45] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                        <div className="space-y-0.5">
                          {pickableStops(customPins, locale, addQuery).map((s) => (
                            <button key={s.id} type="button"
                              onClick={() => { addPoiToDay(addSlot.day, s.id); setAddSlot(null); }}
                              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition hover:bg-[#FF7A45]/10 dark:hover:bg-slate-800">
                              <span>{s.emoji}</span>
                              <span className="flex-1 truncate font-medium text-slate-800 dark:text-slate-200">{s.name}</span>
                              <span className="text-[10px] text-slate-400">{s.isCurated ? "收录" : "自定义"}</span>
                            </button>
                          ))}
                          {addQuery && pickableStops(customPins, locale, addQuery).length === 0 && (
                            <p className="py-4 text-center text-xs text-slate-400">无匹配景点，先去地图/探索添加</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* legend */}
              <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-slate-400">
                <span>💡 鼠标悬停查看详情（可点击） · 点击空白添加景点 · 时间从 09:00 自动排布</span>
              </div>
            </div>
          )}

          {/* ===== EXPLORE TAB ===== */}
          {tab === "explore" && (
            <div className="mt-4">
              <ExploreSection />
            </div>
          )}

          {/* ===== EXPENSES TAB ===== */}
          {tab === "expenses" && (
            <div className="mt-4 max-w-2xl">
              <ExpenseTracker days={days} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
