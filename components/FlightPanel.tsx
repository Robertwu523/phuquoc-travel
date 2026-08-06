"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { useTripStore } from "@/lib/store";
import { flightLinks, addDays, defaultDepartDate, type FlightQuery } from "@/lib/deeplinks";

export default function FlightPanel() {
  const t = useTranslations("Flights");
  const hydrated = useTripStore((s) => s._hasHydrated);
  const tripStart = useTripStore((s) => s.startDate);
  const tripDays = useTripStore((s) => s.days);

  const [departDate, setDepartDate] = useState("");
  const [tripType, setTripType] = useState<"round" | "oneway">("round");
  const [adults, setAdults] = useState(1);
  const [synced, setSynced] = useState(false);

  // Initialize flight dates from the trip planner once it has hydrated.
  useEffect(() => {
    if (hydrated && !synced) {
      setDepartDate(tripStart || defaultDepartDate());
      setSynced(true);
    }
  }, [hydrated, tripStart, synced]);

  // Keep departure in sync if the user later changes the trip start date.
  useEffect(() => {
    if (synced && tripStart) setDepartDate(tripStart);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripStart]);

  const returnDate =
    tripType === "round" && departDate ? addDays(departDate, tripDays) : undefined;

  const query: FlightQuery = {
    departDate,
    returnDate,
    adults,
  };
  const ready = departDate !== "";

  return (
    <section id="flights" className="scroll-mt-20 bg-white py-12 dark:bg-slate-900/40">
      <div className="mx-auto max-w-6xl px-4">
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-teal-50 to-white p-6 dark:border-slate-800 dark:from-teal-950/30 dark:to-slate-900">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex rounded-lg border border-slate-300 p-0.5 dark:border-slate-700">
              {(["round", "oneway"] as const).map((tt) => (
                <button
                  key={tt}
                  type="button"
                  onClick={() => setTripType(tt)}
                  className={
                    "rounded-md px-3 py-1.5 text-sm font-medium transition " +
                    (tripType === tt
                      ? "bg-teal-600 text-white"
                      : "text-slate-600 hover:text-teal-700 dark:text-slate-300")
                  }
                >
                  {t(tt === "round" ? "roundTrip" : "oneWay")}
                </button>
              ))}
            </div>

            <label className="flex flex-col text-xs font-medium text-slate-600 dark:text-slate-300">
              {t("departLabel")}
              <input
                type="date"
                value={departDate}
                onChange={(e) => setDepartDate(e.target.value)}
                className="mt-1 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </label>

            {tripType === "round" && (
              <label className="flex flex-col text-xs font-medium text-slate-600 dark:text-slate-300">
                {t("returnLabel")}
                <input
                  type="date"
                  value={returnDate ?? ""}
                  readOnly
                  className="mt-1 cursor-not-allowed rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                  title={`${t("returnLabel")} = ${t("departLabel")} + ${tripDays}d`}
                />
              </label>
            )}

            <label className="flex flex-col text-xs font-medium text-slate-600 dark:text-slate-300">
              {t("adultsLabel")}
              <select
                value={adults}
                onChange={(e) => setAdults(Number(e.target.value))}
                className="mt-1 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {flightLinks.map((link, idx) => (
              <a
                key={link.key}
                href={ready ? link.url(query) : undefined}
                target="_blank"
                rel="noopener noreferrer sponsored"
                aria-disabled={!ready}
                onClick={(e) => {
                  if (!ready) e.preventDefault();
                }}
                className={
                  "rounded-full px-5 py-2.5 text-sm font-semibold shadow-sm transition " +
                  (idx === 0
                    ? "bg-orange-500 text-white hover:bg-orange-600"
                    : "bg-slate-900 text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900") +
                  (!ready ? " cursor-not-allowed opacity-50" : "")
                }
              >
                {t(link.labelKey)}
              </a>
            ))}
          </div>

          <p className="mt-4 text-xs text-slate-500">{t("carriersNote")}</p>
          <p className="mt-1 text-xs text-slate-400">{t("affiliateNote")}</p>
        </div>
      </div>
    </section>
  );
}
