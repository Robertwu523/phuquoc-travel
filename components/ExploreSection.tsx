"use client";

import { useState } from "react";
import { routeTemplates } from "@/data/routeTemplates";
import { pois } from "@/data/pois";
import { useTripStore } from "@/lib/store";

const THEMES = ["全部", "自然风光", "美食探店", "亲子", "小长假深度游"];

export default function ExploreSection() {
  const [theme, setTheme] = useState("全部");
  const [query, setQuery] = useState("");
  const [adopted, setAdopted] = useState<string | null>(null);

  const setDays = useTripStore((s) => s.setDays);
  const setDayOrder = useTripStore((s) => s.setDayOrder);
  const clearAll = useTripStore((s) => s.clearAll);

  const filtered = routeTemplates.filter(
    (r) =>
      (theme === "全部" || r.theme === theme) &&
      (query === "" || r.title.includes(query) || r.subtitle.includes(query))
  );

  function adoptRoute(routeId: string) {
    const route = routeTemplates.find((r) => r.id === routeId);
    if (!route) return;
    clearAll();
    setDays(route.days);
    for (const s of route.schedule) {
      const valid = s.poiIds.filter((id) => pois.some((p) => p.id === id));
      if (valid.length) setDayOrder(s.day, valid);
    }
    setAdopted(routeId);
    setTimeout(() => setAdopted(null), 3000);
  }

  return (
    <div>
      {/* search */}
      <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <span className="text-slate-400">🔍</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索路线、景点…"
          className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white"
        />
      </div>

      {/* theme chips */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {THEMES.map((th) => (
          <button
            key={th}
            type="button"
            onClick={() => setTheme(th)}
            className={
              "rounded-full px-3 py-1 text-xs font-medium ring-1 transition " +
              (theme === th
                ? "bg-slate-900 text-white ring-slate-900"
                : "bg-white text-slate-600 ring-slate-200 hover:ring-slate-300 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700")
            }
          >
            {th}
          </button>
        ))}
      </div>

      {/* route cards */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {filtered.map((route) => (
          <div
            key={route.id}
            className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="relative h-36 overflow-hidden">
              <img
                src={route.image}
                alt={route.title}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-2 left-3 right-3">
                <span className="rounded-full bg-[#FF7A45] px-2 py-0.5 text-[10px] font-bold text-white">
                  {route.days} 天 · {route.theme}
                </span>
                <h3 className="mt-1 text-base font-extrabold text-white">{route.title}</h3>
              </div>
            </div>
            <div className="p-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">{route.description}</p>
              <div className="mt-2 space-y-1">
                {route.schedule.map((s) => (
                  <div key={s.day} className="flex items-start gap-1.5 text-[11px]">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#FF7A45] text-[9px] font-bold text-white">
                      {s.day + 1}
                    </span>
                    <span className="text-slate-400">
                      {s.poiIds
                        .map((id) => pois.find((p) => p.id === id)?.name.zh)
                        .filter(Boolean)
                        .join(" → ")}
                    </span>
                  </div>
                ))}
              </div>
              {adopted === route.id ? (
                <div className="mt-2 w-full rounded-lg bg-teal-600 py-1.5 text-center text-xs font-bold text-white">
                  ✓ 已采用！切换到「行程」Tab 查看
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => adoptRoute(route.id)}
                  className="mt-2 w-full rounded-lg bg-[#FF7A45] py-1.5 text-xs font-bold text-white transition hover:bg-[#e6662e]"
                >
                  采用此路线
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
