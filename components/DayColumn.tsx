"use client";

import { useLocale, useTranslations } from "next-intl";

import { resolveStop } from "@/lib/stops";
import { useTripStore } from "@/lib/store";

export default function DayColumn({ day }: { day: number }) {
  const tp = useTranslations("Planner");
  const locale = useLocale() as "zh" | "en";

  const selectedDay = useTripStore((s) => s.selectedDay);
  const setSelectedDay = useTripStore((s) => s.setSelectedDay);
  const removePoiFromDay = useTripStore((s) => s.removePoiFromDay);
  const movePoi = useTripStore((s) => s.movePoi);
  const customPins = useTripStore((s) => s.customPins);
  const list = useTripStore((s) => s.dayAssignments[day]) ?? [];

  const active = selectedDay === day;

  return (
    <div
      className={
        "rounded-xl border p-3 transition " +
        (active
          ? "border-teal-500 bg-teal-50 ring-1 ring-teal-500 dark:border-teal-400 dark:bg-teal-950/30"
          : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900")
      }
    >
      <button
        type="button"
        onClick={() => setSelectedDay(day)}
        className="flex w-full items-center justify-between"
      >
        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
          {tp("day", { n: day + 1 })}
        </span>
        {active && (
          <span className="rounded-full bg-teal-600 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
            edit
          </span>
        )}
      </button>

      {list.length === 0 ? (
        <p className="mt-2 text-xs text-slate-400">{tp("emptyDay")}</p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {list.map((id, i) => {
            const stop = resolveStop(id, customPins, locale);
            if (!stop) return null;
            return (
              <li
                key={id}
                className="flex items-center gap-1.5 rounded-lg bg-slate-50 p-1.5 dark:bg-slate-800/60"
              >
                <span className="text-base">{stop.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-medium text-slate-800 dark:text-slate-200">
                    {stop.name || "—"}
                  </div>
                  <div className="text-[10px] text-slate-400">{stop.duration}h</div>
                </div>
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => movePoi(day, i, -1)}
                    disabled={i === 0}
                    className="px-1 text-[10px] text-slate-400 hover:text-teal-600 disabled:opacity-30"
                    aria-label={tp("moveUp")}
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => movePoi(day, i, 1)}
                    disabled={i === list.length - 1}
                    className="px-1 text-[10px] text-slate-400 hover:text-teal-600 disabled:opacity-30"
                    aria-label={tp("moveDown")}
                  >
                    ▼
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removePoiFromDay(day, id)}
                  className="px-1 text-xs text-slate-400 hover:text-red-500"
                  aria-label={tp("remove")}
                >
                  ✕
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
