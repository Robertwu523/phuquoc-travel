"use client";

import { useTranslations } from "next-intl";
import { useTripStore } from "@/lib/store";
import PoiSidebar from "./PoiSidebar";
import PhuQuocMapClient from "./PhuQuocMapClient";

export default function MapWorkspace() {
  const t = useTranslations("Map");
  const tp = useTranslations("Planner");
  const hydrated = useTripStore((s) => s._hasHydrated);
  const days = useTripStore((s) => s.days);
  const selectedDay = useTripStore((s) => s.selectedDay);
  const setSelectedDay = useTripStore((s) => s.setSelectedDay);

  const dayArr = Array.from({ length: days }, (_, i) => i);

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <p className="mb-3 text-xs font-medium text-pink-600 dark:text-pink-400">
        📍 {t("dropHint")}
      </p>

      {/* which day are we adding to */}
      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {tp("editingDay")}:
        </span>
        {dayArr.map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => setSelectedDay(i)}
            className={
              "rounded-full px-3 py-1 text-xs font-semibold transition " +
              (i === selectedDay
                ? "bg-teal-600 text-white shadow-sm"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-teal-300 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700")
            }
          >
            {tp("day", { n: i + 1 })}
          </button>
        ))}
      </div>

      {!hydrated ? (
        <div className="h-[70vh] animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-800/60" />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <aside className="lg:col-span-3">
            <div className="lg:sticky lg:top-28 lg:h-[70vh]">
              <PoiSidebar />
            </div>
          </aside>
          <div className="h-[60vh] overflow-hidden rounded-2xl border border-slate-200 shadow-sm lg:col-span-9 lg:h-[70vh] dark:border-slate-800">
            <PhuQuocMapClient />
          </div>
        </div>
      )}
    </section>
  );
}
