"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useLocale, useTranslations } from "next-intl";
import { useTripStore, selectTotalPois } from "@/lib/store";
import { resolveStop, type MapStop, type Locale } from "@/lib/stops";
import { styleFor, categoryStyles } from "@/lib/categories";
import { pois } from "@/data/pois";
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

type Tab = "timeline" | "expenses";

function computeSchedule(stops: MapStop[], durArr: number[], startArr: number[]) {
  // Each stop is placed independently: explicit start time if set, otherwise a
  // default 09:00. We do NOT cascade auto-starts off the previous stop's end —
  // that made dragging one stop shove all the un-pinned ones after it. Users
  // who want them spaced out can drag each into place (which pins its time).
  const DEFAULT_START = 9 * 60; // 09:00
  return stops.map((stop, i) => {
    const start = startArr[i] >= 0 ? startArr[i] : DEFAULT_START;
    const useHours = durArr[i] > 0 ? durArr[i] : stop.duration;
    const dur = Math.max(15, useHours * 60);
    const end = start + dur;
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
  const dragMove = useTripStore((s) => s.dragMove);
  const stopDurations = useTripStore((s) => s.stopDurations);
  const stopStartTimes = useTripStore((s) => s.stopStartTimes);
  const setStopDuration = useTripStore((s) => s.setStopDuration);
  const setStopStartTime = useTripStore((s) => s.setStopStartTime);
  const total = useTripStore(selectTotalPois);
  const [tab, setTab] = useState<Tab>("timeline");
  const [addSlot, setAddSlot] = useState<{ day: number; timeMin: number; x: number; y: number } | null>(null);
  const [addQuery, setAddQuery] = useState("");
  const [dragInfo, setDragInfo] = useState<{
    day: number; fromIdx: number; stopId: string;
    startX: number; moved: boolean; origLeft: number;
    trackEl: HTMLElement | null;
  } | null>(null);
  const [editDur, setEditDur] = useState<{ day: number; idx: number; stopId: string; value: number } | null>(null);
  const [customEvent, setCustomEvent] = useState<{ day: number; timeMin: number } | null>(null);
  const [hovered, setHovered] = useState<{
    day: number; stopId: string; stopName: string; stopEmoji: string;
    startLabel: string; endLabel: string; duration: number; lat: number; lng: number;
    isCurated: boolean; blockRect: DOMRect; idx: number;
  } | null>(null);
  const hoverTimer = useRef<NodeJS.Timeout | null>(null);
  const justDragged = useRef(false);

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
    { key: "expenses", label: "记账", emoji: "💰" },
  ];

  return (
    <div className="relative pt-24 md:pt-16">
      {/* paradise beach photo — only on this page, fixed behind content */}
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center"
        style={{ backgroundImage: "url(/images/phuquoc-paradise.jpg)" }}
      />
      <div className="fixed inset-0 -z-10 bg-white/45" />
      {!hydrated ? (
        <div className="mx-auto max-w-7xl px-4 py-20">
          <div className="h-40 animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-800/60" />
        </div>
      ) : (
        <div className="mx-auto max-w-7xl px-3 py-4">
          {/* summary bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/50 bg-white/75 px-5 py-3 shadow-sm backdrop-blur-md">
            <div className="flex items-baseline gap-3">
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">📋 富国岛行程</h1>
              <span className="text-base text-slate-500 dark:text-slate-400">{rangeStr} · {days}天 · <span className="font-semibold text-[#FF7A45]">{total}</span>个景点</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                出发
                <input type="date" value={startDate ?? ""} onChange={(e) => setStartDate(e.target.value || null)}
                  className="rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 focus:outline-none focus:border-[#FF7A45] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 [color-scheme:light] dark:[color-scheme:dark]" />
              </label>
              <label className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                天数
                <input type="number" min={1} max={30} value={days} onChange={(e) => setDays(Number(e.target.value))}
                  className="w-16 rounded border border-slate-300 bg-white px-1 py-1 text-sm text-slate-700 focus:outline-none focus:border-[#FF7A45] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
              </label>
              <button type="button" onClick={clearAll}
                className="rounded border border-slate-300 px-2 py-1 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                {tp("clearAll")}
              </button>
            </div>
          </div>

          {/* tabs */}
          <div className="mt-3 flex gap-1 rounded-xl border border-white/50 bg-white/75 p-1 shadow-sm backdrop-blur-md">
            {TABS.map((tb) => (
              <button key={tb.key} type="button" onClick={() => setTab(tb.key)}
                className={"flex-1 rounded-lg py-2.5 text-base font-semibold transition " +
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
                    <Link href="/map" className="rounded-full bg-[#FF7A45] px-5 py-2 text-sm font-semibold text-white">
                      去地图选点 →
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-white/50 bg-white/75 shadow-sm backdrop-blur-md">
                  {/* hour header */}
                  <div className="flex border-b border-slate-200/70 bg-white/40">
                    <div className="w-[110px] shrink-0 border-r border-slate-200 px-2 py-1.5 text-xs font-bold uppercase text-slate-400 dark:border-slate-700">
                      日期
                    </div>
                    <div className="relative" style={{ width: TIMELINE_WIDTH, minWidth: TIMELINE_WIDTH }}>
                      <div className="flex">
                        {HOUR_LABELS.map((label, i) => (
                          <div key={i} className="text-[11px] text-slate-400" style={{ width: PX_PER_HOUR }}>
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
                    const durArr = ids.map((_, i) => stopDurations[`${dayIdx}-${i}`] ?? -1);
                    const startArr = ids.map((_, i) => stopStartTimes[`${dayIdx}-${i}`] ?? -1);
                    const schedule = computeSchedule(stops, durArr, startArr);
                    const totalMin = schedule.length > 0
                      ? schedule[schedule.length - 1].endMin - schedule[0].startMin
                      : 0;

                    return (
                      <div key={dayIdx} className="flex border-b border-slate-100 dark:border-slate-800">
                        {/* day label */}
                        <div className="w-[110px] shrink-0 border-r border-slate-200 px-2 py-2 dark:border-slate-700">
                          <div className="text-sm font-bold text-slate-900 dark:text-white">第 {dayIdx + 1} 天</div>
                          <div className="text-xs text-slate-400">{dateForDay(dayIdx)}</div>
                          <div className="mt-0.5 text-xs text-[#FF7A45]">{stops.length} 站</div>
                        </div>

                        {/* timeline track */}
                        <div
                          className="relative cursor-pointer"
                          style={{ width: TIMELINE_WIDTH, minWidth: TIMELINE_WIDTH, minHeight: 56 }}
                          onClick={(e) => {
                            if (hovered) { setHovered(null); return; }
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

                          {/* stop blocks with pointer-event free drag */}
                          {schedule.map(({ stop, startMin, endMin }, i) => {
                            const st = styleFor(stop.category);
                            const left = minToX(startMin);
                            const width = Math.max(40, ((endMin - startMin) / 60) * PX_PER_HOUR);
                            return (
                              <div
                                key={stop.id + i}
                                className="absolute top-1.5 z-10 cursor-grab active:cursor-grabbing"
                                style={{ left, width, opacity: dragInfo?.fromIdx === i && dragInfo?.day === dayIdx ? 0.35 : 1 }}
                                onPointerDown={(e) => {
                                  if (e.button !== 0) return;
                                  e.currentTarget.setPointerCapture(e.pointerId);
                                  const trackEl = e.currentTarget.parentElement!;
                                  setDragInfo({
                                    day: dayIdx, fromIdx: i, stopId: stop.id,
                                    startX: e.clientX, moved: false,
                                    origLeft: left, trackEl,
                                  });
                                }}
                                onPointerMove={(e) => {
                                  if (!dragInfo || dragInfo.day !== dayIdx || dragInfo.fromIdx !== i) return;
                                  const dx = e.clientX - dragInfo.startX;
                                  if (!dragInfo.moved && Math.abs(dx) < 5) return;
                                  setDragInfo({ ...dragInfo, moved: true });
                                  // snap to 15-min
                                  const newLeft = Math.max(0, Math.min(TIMELINE_WIDTH - width, dragInfo.origLeft + dx));
                                  e.currentTarget.style.left = `${newLeft}px`;
                                }}
                                onPointerUp={(e) => {
                                  if (!dragInfo || dragInfo.day !== dayIdx || dragInfo.fromIdx !== i) return;
                                  e.currentTarget.releasePointerCapture(e.pointerId);
                                  if (dragInfo.moved) {
                                    justDragged.current = true;
                                    const curLeft = parseFloat(e.currentTarget.style.left) || dragInfo.origLeft;
                                    const timeMin = Math.round((curLeft / PX_PER_HOUR + START_HOUR) * 60 / 15) * 15;
                                    setStopStartTime(dayIdx, i, timeMin);
                                    e.currentTarget.style.left = `${minToX(timeMin)}px`;
                                  }
                                  setDragInfo(null);
                                }}
                                onMouseEnter={(e) => {
                                  if (dragInfo) return;
                                  if (hoverTimer.current) clearTimeout(hoverTimer.current);
                                  const r = e.currentTarget.getBoundingClientRect();
                                  setHovered({
                                    day: dayIdx, stopId: stop.id, stopName: stop.name || "",
                                    stopEmoji: stop.emoji, startLabel: minToLabel(startMin),
                                    endLabel: minToLabel(endMin), duration: (endMin - startMin) / 60,
                                    lat: stop.lat, lng: stop.lng, isCurated: stop.isCurated, blockRect: r,
                                    idx: i,
                                  });
                                }}
                                onMouseLeave={() => {
                                  hoverTimer.current = setTimeout(() => setHovered(null), 200);
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (justDragged.current) { justDragged.current = false; return; }
                                  if (hovered && hovered.day === dayIdx && hovered.idx === i) {
                                    setHovered(null);
                                  } else {
                                    const r = e.currentTarget.getBoundingClientRect();
                                    setHovered({
                                      day: dayIdx, stopId: stop.id, stopName: stop.name || "",
                                      stopEmoji: stop.emoji, startLabel: minToLabel(startMin),
                                      endLabel: minToLabel(endMin), duration: (endMin - startMin) / 60,
                                      lat: stop.lat, lng: stop.lng, isCurated: stop.isCurated, blockRect: r, idx: i,
                                    });
                                  }
                                }}
                              >
                                <div
                                  className="flex h-[48px] items-center gap-1 rounded-lg px-2 text-white shadow-sm transition hover:brightness-110 hover:shadow-lg"
                                  style={{ background: st.color, width: "100%" }}
                                >
                                  <span className="shrink-0 text-sm">{stop.emoji}</span>
                                  <span className="truncate text-xs font-bold">{stop.name}</span>
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

                  {/* floating hover card — portaled to <body> so backdrop-blur on
                      this container can't trap the fixed-position card. */}
                  {hovered && createPortal(
                    <div
                      className="fixed z-[2000] min-w-[240px] rounded-xl border border-slate-200 bg-white p-3 shadow-xl transition-opacity duration-150 dark:border-slate-700 dark:bg-slate-900"
                      style={{
                        top: Math.min(hovered.blockRect.bottom + 4, (typeof window !== "undefined" ? window.innerHeight : 9999) - 230),
                        left: Math.max(8, Math.min(hovered.blockRect.left, (typeof window !== "undefined" ? window.innerWidth : 9999) - 260)),
                      }}
                      onMouseEnter={() => { if (hoverTimer.current) clearTimeout(hoverTimer.current); }}
                      onMouseLeave={() => setHovered(null)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{hovered.stopEmoji}</span>
                        <div className="flex-1">
                          <div className="text-sm font-bold text-slate-900 dark:text-white">{hovered.stopName}</div>
                          <div className="text-[10px] text-slate-400">{hovered.startLabel} – {hovered.endLabel}</div>
                        </div>
                        {/* duration editor */}
                        <div className="flex items-center gap-0.5 rounded-md border border-slate-200 px-1 dark:border-slate-700">
                          <button type="button"
                            onClick={() => {
                              const newD = Math.max(0.25, hovered.duration - 0.25);
                              setStopDuration(hovered.day, hovered.idx, newD);
                              setHovered({ ...hovered, duration: newD });
                            }}
                            className="px-1 text-xs text-slate-500 hover:text-[#FF7A45]">−</button>
                          <span className="w-8 text-center text-[10px] font-bold text-slate-700 dark:text-slate-200">{hovered.duration < 1 ? `${Math.round(hovered.duration * 60)}m` : `${hovered.duration.toFixed(1)}h`}</span>
                          <button type="button"
                            onClick={() => {
                              const newD = Math.min(12, hovered.duration + 0.25);
                              setStopDuration(hovered.day, hovered.idx, newD);
                              setHovered({ ...hovered, duration: newD });
                            }}
                            className="px-1 text-xs text-slate-500 hover:text-[#FF7A45]">+</button>
                        </div>
                      </div>
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
                      <div className="mt-1.5 text-[9px] text-slate-300">💡 拖拽色块可调整顺序 · ± 修改时长</div>
                    </div>,
                    document.body
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
                            <p className="py-4 text-center text-xs text-slate-400">无匹配景点</p>
                          )}
                        </div>

                        {/* custom event creator */}
                        <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">或添加自定义事件</div>
                          <CustomEventForm
                            onSave={(name, emoji, hours) => {
                              const id = `evt-${Date.now()}`;
                              useTripStore.getState().addCustomPin({
                                id, name, lat: 10.2, lng: 104.0, duration: hours, category: "culture",
                              });
                              addPoiToDay(addSlot.day, id);
                              const newIdx = (useTripStore.getState().dayAssignments[addSlot.day]?.length ?? 1) - 1;
                              setStopDuration(addSlot.day, newIdx, hours);
                              setStopStartTime(addSlot.day, newIdx, addSlot.timeMin);
                              setAddSlot(null);
                            }}
                          />
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

function CustomEventForm({ onSave }: { onSave: (name: string, emoji: string, hours: number) => void }) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("📌");
  const [hours, setHours] = useState("1");
  const EMOJIS = ["📌", "🍽️", "☕", "🛍️", "💆", "🏊", "📸", "🚕", "🛏️", "🎉"];

  return (
    <div className="mt-1.5 space-y-1.5">
      <div className="flex gap-1.5">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="事件名称（如：海鲜大餐）"
          className="flex-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#FF7A45] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
        <input type="number" min="0.25" step="0.25" value={hours} onChange={(e) => setHours(e.target.value)}
          className="w-14 rounded-lg border border-slate-300 bg-white px-1.5 py-1.5 text-center text-sm text-slate-900 focus:border-[#FF7A45] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
        <span className="flex items-center text-[10px] text-slate-400">h</span>
      </div>
      <div className="flex flex-wrap gap-0.5">
        {EMOJIS.map((em) => (
          <button key={em} type="button" onClick={() => setEmoji(em)}
            className={"rounded px-1 py-0.5 text-sm transition " + (emoji === em ? "bg-[#FF7A45]/20 ring-1 ring-[#FF7A45]" : "hover:bg-slate-100 dark:hover:bg-slate-800")}>
            {em}
          </button>
        ))}
      </div>
      <button type="button" disabled={!name.trim()}
        onClick={() => onSave(name.trim(), emoji, Math.max(0.25, Number(hours) || 1))}
        className="w-full rounded-lg bg-[#FF7A45] py-1.5 text-xs font-bold text-white transition hover:bg-[#e6662e] disabled:opacity-40">
        + 添加事件
      </button>
    </div>
  );
}
