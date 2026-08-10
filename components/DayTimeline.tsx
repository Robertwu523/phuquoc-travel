"use client";

import { Fragment, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { useTripStore } from "@/lib/store";
import { resolveStop } from "@/lib/stops";
import { osrmRoute, formatDuration, type RouteResult } from "@/lib/routing";

const WEEK = ["日", "一", "二", "三", "四", "五", "六"];

function dateFor(startISO: string | null, i: number): Date | null {
  if (!startISO) return null;
  const d = new Date(`${startISO}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  d.setDate(d.getDate() + i);
  return d;
}

export default function DayTimeline({ day }: { day: number }) {
  const t = useTranslations("Planner");
  const locale = useLocale() as "zh" | "en";

  const ids = useTripStore((s) => s.dayAssignments[day]);
  const customPins = useTripStore((s) => s.customPins);
  const startDate = useTripStore((s) => s.startDate);
  const removePoiFromDay = useTripStore((s) => s.removePoiFromDay);
  const movePoi = useTripStore((s) => s.movePoi);

  const list = ids ?? [];
  const stops = list.map((id) => resolveStop(id, customPins, locale)).filter((s) => s !== null);

  const [route, setRoute] = useState<RouteResult | null>(null);
  const idsKey = list.join(",");
  useEffect(() => {
    if (stops.length < 2) {
      setRoute(null);
      return;
    }
    let cancelled = false;
    osrmRoute(stops.map((s) => [s!.lat, s!.lng]))
      .then((r) => !cancelled && setRoute(r))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  const d = dateFor(startDate, day);
  const dateStr = d
    ? `${d.getMonth() + 1}月${d.getDate()}日 周${WEEK[d.getDay()]}`
    : null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* day header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
        <div className="flex items-baseline gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FF7A45] text-sm font-bold text-white">
            {day + 1}
          </span>
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
            {t("day", { n: day + 1 })}
          </h3>
          {dateStr && <span className="text-xs text-slate-400">· {dateStr}</span>}
        </div>
        <span className="text-xs text-slate-400">{stops.length} 站</span>
      </div>

      {stops.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">{t("emptyDay")}</p>
      ) : (
        <ol className="relative mt-4 space-y-1 border-l-2 border-dashed border-slate-200 pl-6 dark:border-slate-700">
          {stops.map((s, i) => (
            <Fragment key={list[i]}>
              <li className="group relative">
                {/* timeline dot */}
                <span className="absolute -left-[31px] top-3 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-[#FF7A45] text-[8px] shadow">
                  {i + 1}
                </span>
                <div className="flex items-start justify-between gap-2 rounded-xl bg-slate-50 p-3 transition hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800">
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-slate-900 dark:text-white">
                      {s!.emoji} {s!.name || "—"}
                    </div>
                    <div className="text-xs text-slate-500">
                      {s!.duration}h
                      {s!.isCurated ? "" : " · 自定义"}
                    </div>
                  </div>
                  {/* hover edit controls */}
                  <div className="flex shrink-0 items-center gap-0.5 opacity-60 transition group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => movePoi(day, i, -1)}
                      disabled={i === 0}
                      className="rounded px-1 text-[10px] text-slate-400 hover:text-teal-600 disabled:opacity-20"
                      aria-label={t("moveUp")}
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => movePoi(day, i, 1)}
                      disabled={i === stops.length - 1}
                      className="rounded px-1 text-[10px] text-slate-400 hover:text-teal-600 disabled:opacity-20"
                      aria-label={t("moveDown")}
                    >
                      ▼
                    </button>
                    <button
                      type="button"
                      onClick={() => removePoiFromDay(day, list[i])}
                      className="rounded px-1 text-xs text-slate-400 hover:text-red-500"
                      aria-label={t("remove")}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </li>
              {/* leg travel time between stops */}
              {route?.ok && route.legs[i] && (
                <li className="flex items-center gap-1 py-0.5 pl-1 text-[11px] text-slate-400">
                  <span>🚗</span> {formatDuration(route.legs[i].duration)} 驾车
                </li>
              )}
            </Fragment>
          ))}
        </ol>
      )}
    </section>
  );
}
