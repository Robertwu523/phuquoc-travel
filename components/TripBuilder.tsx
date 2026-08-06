"use client";

import { useTranslations } from "next-intl";

import { useTripStore, selectTotalPois } from "@/lib/store";
import DayColumn from "./DayColumn";

export default function TripBuilder() {
  const tp = useTranslations("Planner");
  const days = useTripStore((s) => s.days);
  const startDate = useTripStore((s) => s.startDate);
  const setDays = useTripStore((s) => s.setDays);
  const setStartDate = useTripStore((s) => s.setStartDate);
  const clearAll = useTripStore((s) => s.clearAll);
  const total = useTripStore(selectTotalPois);

  const dayIndexes = Array.from({ length: days }, (_, i) => i);

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col text-xs font-medium text-slate-600 dark:text-slate-300">
          {tp("daysLabel")}
          <input
            type="number"
            min={1}
            max={30}
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="mt-1 w-20 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </label>
        <label className="flex flex-col text-xs font-medium text-slate-600 dark:text-slate-300">
          {tp("startDateLabel")}
          <input
            type="date"
            value={startDate ?? ""}
            onChange={(e) => setStartDate(e.target.value || null)}
            className="mt-1 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </label>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-slate-500">{tp("totalPois", { count: total })}</span>
          <button
            type="button"
            onClick={clearAll}
            className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-red-300 hover:text-red-600 dark:border-slate-700 dark:text-slate-300"
          >
            {tp("clearAll")}
          </button>
        </div>
      </div>

      <div className="mt-3 grid max-h-[560px] grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
        {dayIndexes.map((i) => (
          <DayColumn key={i} day={i} />
        ))}
      </div>
    </div>
  );
}
