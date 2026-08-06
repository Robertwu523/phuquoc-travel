"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { pois, type PoiCategory } from "@/data/pois";
import { categoryStyles } from "@/lib/categories";
import { useTripStore } from "@/lib/store";
import { poiToMapStop, customToMapStop, type MapStop } from "@/lib/stops";

type Filter = PoiCategory | "all";
const FILTERS: Filter[] = [
  "all",
  "beach",
  "family",
  "nature",
  "island",
  "market",
  "temple",
  "culture",
];

type OsmHit = {
  name: string;
  nameEn?: string;
  nameZh?: string;
  kind: string;
  lat: number;
  lng: number;
};

function catFor(kind: string): PoiCategory {
  const k = kind.toLowerCase();
  if (k.includes("beach") || k === "sand") return "beach";
  if (["restaurant", "cafe", "bar", "fast_food", "pub", "food"].some((x) => k.includes(x)))
    return "market";
  if (["attraction", "theme_park", "hotel", "zoo", "aquarium", "aquarium_"].some((x) => k.includes(x)))
    return "family";
  if (["peak", "forest", "park", "waterfall", "viewpoint", "nature_reserve"].some((x) => k.includes(x)))
    return "nature";
  return "culture";
}

export default function PoiSidebar() {
  const t = useTranslations("Categories");
  const tm = useTranslations("Map");
  const tp = useTranslations("Planner");
  const locale = useLocale() as "zh" | "en";
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [osm, setOsm] = useState<OsmHit[]>([]);
  const [osmLoading, setOsmLoading] = useState(false);

  const selectedDay = useTripStore((s) => s.selectedDay);
  const dayAssignments = useTripStore((s) => s.dayAssignments);
  const addPoiToDay = useTripStore((s) => s.addPoiToDay);
  const removeCustomPin = useTripStore((s) => s.removeCustomPin);
  const customPins = useTripStore((s) => s.customPins);
  const addPlace = useTripStore((s) => s.addPlace);
  const setFlyTo = useTripStore((s) => s.setFlyTo);

  const selectedSet = useMemo(
    () => new Set(dayAssignments[selectedDay] ?? []),
    [dayAssignments, selectedDay]
  );

  const items: MapStop[] = useMemo(
    () => [
      ...pois.map((p) => poiToMapStop(p, locale)),
      ...Object.values(customPins).map(customToMapStop),
    ],
    [locale, customPins]
  );

  // debounced OSM search
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setOsm([]);
      setOsmLoading(false);
      return;
    }
    setOsmLoading(true);
    const id = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((d) => {
          setOsm(d.results ?? []);
          setOsmLoading(false);
        })
        .catch(() => {
          setOsm([]);
          setOsmLoading(false);
        });
    }, 450);
    return () => clearTimeout(id);
  }, [query]);

  const q = query.trim().toLowerCase();
  const curatedMatches = useMemo(
    () => (q ? pois.filter((p) => (p.name.zh + " " + p.name.en).toLowerCase().includes(q)) : []),
    [q]
  );

  function pickCurated(id: string, lat: number, lng: number) {
    addPoiToDay(selectedDay, id);
    setFlyTo({ lat, lng, zoom: 14 });
    setQuery("");
  }
  function pickOsm(hit: OsmHit) {
    const category = catFor(hit.kind);
    addPlace(selectedDay, {
      name: hit.nameZh || hit.nameEn || hit.name,
      lat: hit.lat,
      lng: hit.lng,
      category,
    });
    setFlyTo({ lat: hit.lat, lng: hit.lng, zoom: 15 });
    setQuery("");
  }

  const visible = items.filter((s) => filter === "all" || s.category === filter);
  const searching = q.length >= 2 || (q.length >= 1 && curatedMatches.length > 0);

  return (
    <div className="flex h-full flex-col">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={tm("searchPlaceholder")}
        className="mb-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      />

      {searching ? (
        <div className="flex-1 overflow-y-auto pr-1">
          <h3 className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
            {tm("curatedSection")}
          </h3>
          {curatedMatches.length === 0 ? (
            <p className="mb-2 text-xs text-slate-400">{tm("noResults")}</p>
          ) : (
            <ul className="mb-3 space-y-1.5">
              {curatedMatches.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => pickCurated(p.id, p.lat, p.lng)}
                    className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white p-2 text-left text-sm hover:border-teal-300 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <span className="truncate font-medium text-slate-800 dark:text-slate-200">
                      {categoryStyles[p.category].emoji} {p.name[locale]}
                    </span>
                    <span className="shrink-0 pl-2 text-xs font-semibold text-teal-700 dark:text-teal-400">
                      +
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {q.length >= 2 && (
            <>
              <h3 className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                {tm("onlineSection")}
              </h3>
              {osmLoading ? (
                <p className="text-xs text-slate-400">{tm("searching")}</p>
              ) : osm.length === 0 ? (
                <p className="text-xs text-slate-400">{tm("noResults")}</p>
              ) : (
                <ul className="space-y-1.5">
                  {osm.map((h, i) => (
                    <li key={`${h.name}-${i}`}>
                      <button
                        type="button"
                        onClick={() => pickOsm(h)}
                        className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white p-2 text-left hover:border-teal-300 dark:border-slate-800 dark:bg-slate-900"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                            🌐 {h.name}
                          </span>
                          <span className="block truncate text-[11px] text-slate-400">
                            {h.nameEn && h.nameEn !== h.name ? h.nameEn + " · " : ""}
                            {h.kind}
                          </span>
                        </span>
                        <span className="shrink-0 pl-2 text-xs font-semibold text-teal-700 dark:text-teal-400">
                          +
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      ) : (
        <>
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
            {tm("catalogTitle")}
          </h2>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {FILTERS.map((f) => {
              const active = filter === f;
              const style = f === "all" ? null : categoryStyles[f];
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={
                    "rounded-full px-2.5 py-1 text-xs font-medium ring-1 transition " +
                    (active
                      ? "bg-slate-900 text-white ring-slate-900"
                      : "bg-white text-slate-600 ring-slate-200 hover:ring-slate-300 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700")
                  }
                >
                  {style ? `${style.emoji} ` : ""}
                  {t(f === "all" ? "all" : (f as PoiCategory))}
                </button>
              );
            })}
          </div>

          <ul className="mt-3 flex-1 space-y-2 overflow-y-auto pr-1">
            {visible.map((stop) => {
              const added = selectedSet.has(stop.id);
              return (
                <li
                  key={stop.id}
                  className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {stop.emoji} {stop.name || "—"}
                        {!stop.isCurated && (
                          <span className="ml-1 align-middle text-[9px] font-bold uppercase text-pink-500">
                            ●
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 text-[11px] text-slate-500">
                        {tm("durationHours", { hours: stop.duration })}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {!stop.isCurated && (
                        <button
                          type="button"
                          onClick={() => removeCustomPin(stop.id)}
                          aria-label="delete"
                          className="rounded-md px-1.5 py-1 text-xs text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                        >
                          ✕
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => addPoiToDay(selectedDay, stop.id)}
                        disabled={added}
                        className={
                          "rounded-md px-2 py-1 text-xs font-semibold transition " +
                          (added
                            ? "cursor-default bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300"
                            : "bg-teal-600 text-white hover:bg-teal-700")
                        }
                      >
                        {added
                          ? tm("added", { day: selectedDay + 1 })
                          : `+ ${tp("day", { n: selectedDay + 1 })}`}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
