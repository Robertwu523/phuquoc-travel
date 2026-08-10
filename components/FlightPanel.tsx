"use client";

import { useEffect, useState } from "react";
import { useTripStore } from "@/lib/store";
import {
  googleFlightsUrl,
  skyscannerUrl,
  tripcomUrl,
  addDays,
  defaultDepartDate,
  type FlightQuery,
} from "@/lib/deeplinks";

type Cabin = "economy" | "premium" | "business" | "first";
const CABIN_LABELS: Record<Cabin, string> = {
  economy: "经济舱",
  premium: "超级经济舱",
  business: "商务舱",
  first: "头等舱",
};

// common airports for the <datalist> autocomplete
const AIRPORTS = [
  { code: "HKG", name: "香港 HKG" },
  { code: "PQC", name: "富国岛 PQC" },
  { code: "SGN", name: "胡志明市 SGN" },
  { code: "HAN", name: "河内 HAN" },
  { code: "BKK", name: "曼谷 BKK" },
  { code: "SIN", name: "新加坡 SIN" },
  { code: "KUL", name: "吉隆坡 KUL" },
  { code: "MFM", name: "澳门 MFM" },
  { code: "CAN", name: "广州 CAN" },
  { code: "SZX", name: "深圳 SZX" },
];

type SavedFlight = {
  id: string;
  airline: string;
  flightNo: string;
  route: string;
  departTime: string;
  arriveTime: string;
  price: string;
  notes: string;
};

const FKEY = "phuquoc-manual-flights";

export default function FlightPanel() {
  const tripStart = useTripStore((s) => s.startDate);
  const tripDays = useTripStore((s) => s.days);
  const hydrated = useTripStore((s) => s._hasHydrated);

  const [tripType, setTripType] = useState<"round" | "oneway">("round");
  const [origin, setOrigin] = useState("HKG");
  const [destination, setDestination] = useState("PQC");
  const [departDate, setDepartDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [showPax, setShowPax] = useState(false);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [cabin, setCabin] = useState<Cabin>("economy");
  const [searched, setSearched] = useState(false);

  const [flights, setFlights] = useState<SavedFlight[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    airline: "",
    flightNo: "",
    route: "HKG → PQC",
    departTime: "",
    arriveTime: "",
    price: "",
    notes: "",
  });

  // sync dates from trip planner
  useEffect(() => {
    if (hydrated) {
      const base = tripStart || defaultDepartDate();
      setDepartDate(base);
      setReturnDate(addDays(base, tripDays));
    }
  }, [hydrated, tripStart, tripDays]);

  // load manual flights
  useEffect(() => {
    try {
      const raw = localStorage.getItem(FKEY);
      if (raw) setFlights(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  function saveFlights(f: SavedFlight[]) {
    setFlights(f);
    try {
      localStorage.setItem(FKEY, JSON.stringify(f));
    } catch {
      /* ignore */
    }
  }

  function addFlight() {
    if (!form.airline && !form.flightNo) return;
    saveFlights([...flights, { id: `flight-${Date.now()}`, ...form }]);
    setForm({ airline: "", flightNo: "", route: "HKG → PQC", departTime: "", arriveTime: "", price: "", notes: "" });
    setShowForm(false);
  }

  function deleteFlight(id: string) {
    saveFlights(flights.filter((f) => f.id !== id));
  }

  function swap() {
    const t = origin;
    setOrigin(destination);
    setDestination(t);
  }

  const query: FlightQuery = {
    origin,
    destination,
    departDate,
    returnDate: tripType === "round" ? returnDate : undefined,
    adults,
    children,
    infants,
    cabin,
  };

  const paxLabel = `${adults}成人${children ? ` ${children}儿童` : ""}${
    infants ? ` ${infants}婴儿` : ""
  } · ${CABIN_LABELS[cabin]}`;

  const ready = departDate !== "";

  return (
    <section className="bg-slate-50 py-10 dark:bg-slate-950">
      <div className="mx-auto max-w-4xl px-4">
        {/* ===== search card (Ctrip-style) ===== */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
          {/* tabs */}
          <div className="flex border-b border-slate-100 dark:border-slate-800">
            {(["round", "oneway"] as const).map((tt) => (
              <button
                key={tt}
                type="button"
                onClick={() => setTripType(tt)}
                className={
                  "px-6 py-3 text-sm font-semibold transition " +
                  (tripType === tt
                    ? "border-b-2 border-[#FF7A45] text-[#FF7A45]"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400")
                }
              >
                {tt === "round" ? "往返" : "单程"}
              </button>
            ))}
          </div>

          <div className="p-5">
            {/* from → to */}
            <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
              <label className="flex flex-col">
                <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">出发地</span>
                <input
                  list="airports"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value.toUpperCase().slice(0, 3))}
                  placeholder="HKG"
                  className="mt-0.5 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-lg font-bold text-slate-900 focus:border-[#FF7A45] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </label>
              <button
                type="button"
                onClick={swap}
                aria-label="swap"
                className="mb-1 flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-slate-500 transition hover:bg-[#FF7A45] hover:text-white dark:border-slate-600"
              >
                ⇄
              </button>
              <label className="flex flex-col">
                <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">目的地</span>
                <input
                  list="airports"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value.toUpperCase().slice(0, 3))}
                  placeholder="PQC"
                  className="mt-0.5 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-lg font-bold text-slate-900 focus:border-[#FF7A45] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </label>
              <datalist id="airports">
                {AIRPORTS.map((a) => (
                  <option key={a.code} value={a.code}>
                    {a.name}
                  </option>
                ))}
              </datalist>
            </div>

            {/* dates */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <label className="flex flex-col">
                <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  {tripType === "round" ? "去程日期" : "出发日期"}
                </span>
                <input
                  type="date"
                  value={departDate}
                  onChange={(e) => setDepartDate(e.target.value)}
                  className="mt-0.5 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 focus:border-[#FF7A45] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </label>
              {tripType === "round" && (
                <label className="flex flex-col">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">返程日期</span>
                  <input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="mt-0.5 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 focus:border-[#FF7A45] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </label>
              )}
            </div>

            {/* passengers + cabin + search */}
            <div className="mt-3 flex flex-wrap items-end gap-2">
              <button
                type="button"
                onClick={() => setShowPax((v) => !v)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-medium text-slate-700 hover:border-[#FF7A45] dark:border-slate-700 dark:text-slate-300"
              >
                👥 {paxLabel}
              </button>

              <button
                type="button"
                onClick={() => setSearched(true)}
                disabled={!ready}
                className="ml-auto flex items-center gap-2 rounded-lg bg-[#FF7A45] px-8 py-2.5 text-base font-bold text-white shadow-md transition hover:bg-[#e6662e] disabled:opacity-50"
              >
                🔍 搜索机票
              </button>
            </div>

            {/* passenger popup */}
            {showPax && (
              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "成人(12+)", val: adults, set: setAdults, min: 1, max: 9 },
                    { label: "儿童(2-12)", val: children, set: setChildren, min: 0, max: 8 },
                    { label: "婴儿(<2)", val: infants, set: setInfants, min: 0, max: 4 },
                  ].map((p) => (
                    <div key={p.label}>
                      <div className="text-xs font-medium text-slate-500">{p.label}</div>
                      <div className="mt-1 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => p.set(Math.max(p.min, p.val - 1))}
                          className="h-7 w-7 rounded-full border border-slate-300 text-sm dark:border-slate-600"
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-sm font-bold">{p.val}</span>
                        <button
                          type="button"
                          onClick={() => p.set(Math.min(p.max, p.val + 1))}
                          className="h-7 w-7 rounded-full border border-slate-300 text-sm dark:border-slate-600"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3">
                  <div className="text-xs font-medium text-slate-500">舱位</div>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {(Object.keys(CABIN_LABELS) as Cabin[]).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCabin(c)}
                        className={
                          "rounded-full px-3 py-1 text-xs font-medium transition " +
                          (cabin === c
                            ? "bg-[#FF7A45] text-white"
                            : "bg-white text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300")
                        }
                      >
                        {CABIN_LABELS[c]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ===== redirect results ===== */}
        {searched && ready && (
          <div className="mt-6">
            <h3 className="mb-3 text-sm font-bold text-slate-700 dark:text-slate-200">
              选择平台查实时票价 ↓
            </h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <RedirectCard
                href={tripcomUrl(query)}
                emoji="🟠"
                name="携程 / Trip.com"
                desc="亚洲航线价格优"
                accent="bg-orange-500"
              />
              <RedirectCard
                href={skyscannerUrl(query)}
                emoji="🔵"
                name="Skyscanner"
                desc="全球比价神器"
                accent="bg-sky-500"
              />
              <RedirectCard
                href={googleFlightsUrl(query)}
                emoji="🔴"
                name="Google Flights"
                desc="趋势 + 灵活日期"
                accent="bg-rose-500"
              />
            </div>
            <p className="mt-3 text-xs text-slate-400">
              直飞航司：HK Express、越捷 VietJet Air（约 2 小时 45 分）。价格以平台实时为准。
            </p>
          </div>
        )}

        {/* ===== manual flight info ===== */}
        <div className="mt-10">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              ✈️ 我的航班信息
            </h3>
            <button
              type="button"
              onClick={() => setShowForm((v) => !v)}
              className="rounded-full bg-[#FF7A45] px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-[#e6662e]"
            >
              {showForm ? "取消" : "+ 添加航班"}
            </button>
          </div>

          {showForm && (
            <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={form.airline}
                  onChange={(e) => setForm({ ...form, airline: e.target.value })}
                  placeholder="航空公司（如：HK Express）"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <input
                  value={form.flightNo}
                  onChange={(e) => setForm({ ...form, flightNo: e.target.value })}
                  placeholder="航班号（如：UO568）"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <input
                  value={form.route}
                  onChange={(e) => setForm({ ...form, route: e.target.value })}
                  placeholder="航线（HKG → PQC）"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <input
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="价格（如：HK$1,200）"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <input
                  value={form.departTime}
                  onChange={(e) => setForm({ ...form, departTime: e.target.value })}
                  placeholder="出发时间（如：16:05）"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <input
                  value={form.arriveTime}
                  onChange={(e) => setForm({ ...form, arriveTime: e.target.value })}
                  placeholder="到达时间（如：17:50）"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <input
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="备注（行李额/退改签等）"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <button
                type="button"
                onClick={addFlight}
                className="mt-3 w-full rounded-lg bg-slate-900 py-2.5 text-sm font-bold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900"
              >
                保存航班信息
              </button>
            </div>
          )}

          {/* saved flight cards */}
          {flights.length > 0 && (
            <div className="mt-3 space-y-2">
              {flights.map((f) => (
                <div
                  key={f.id}
                  className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-lg dark:bg-orange-900/40">
                    ✈️
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {f.airline || "—"} {f.flightNo}
                      </span>
                      {f.price && (
                        <span className="text-sm font-bold text-[#FF7A45]">{f.price}</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500">
                      {f.route} · {f.departTime} → {f.arriveTime}
                    </div>
                    {f.notes && <div className="text-xs text-slate-400">📝 {f.notes}</div>}
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteFlight(f.id)}
                    className="px-2 text-xs text-slate-300 transition hover:text-red-500 group-hover:text-slate-400"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {flights.length === 0 && !showForm && (
            <p className="mt-3 text-sm text-slate-400">
              还没有添加航班。在其他平台查到航班后，可以在这里手动记录（航空公司、航班号、时间、价格等）。
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function RedirectCard({
  href,
  emoji,
  name,
  desc,
  accent,
}: {
  href: string;
  emoji: string;
  name: string;
  desc: string;
  accent: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
    >
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl ${accent} text-white`}>
        {emoji}
      </div>
      <div className="flex-1">
        <div className="text-sm font-bold text-slate-900 dark:text-white">{name}</div>
        <div className="text-xs text-slate-500">{desc}</div>
      </div>
      <span className="text-slate-400 transition group-hover:translate-x-0.5">→</span>
    </a>
  );
}
