"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import PageHero from "@/components/PageHero";
import { wmo, aqiLevel, uvLevel } from "@/lib/weatherCodes";
import { markDirty } from "@/lib/sync";

const WeatherMap = dynamic(() => import("@/components/WeatherMap"), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-800/60" />,
});

type Data = {
  current: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    weather_code: number;
    pressure_msl: number;
    visibility: number;
    wind_speed_10m: number;
    uv_index: number;
  };
  hourly: { time: string[]; temperature_2m: number[]; weather_code: number[]; precipitation_probability: number[] };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    sunrise: string[];
    sunset: string[];
    uv_index_max: number[];
    precipitation_probability_max: number[];
  };
  air: { pm2_5: number; us_aqi: number } | null;
  fetchedAt: string;
};

const DEF_LAT = 10.2;
const DEF_LNG = 104.0;
const WEEK = ["日", "一", "二", "三", "四", "五", "六"];

function hh(iso: string) {
  return iso.slice(11, 16);
}
function dateLabel(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return `${d.getMonth() + 1}月${d.getDate()}日 周${WEEK[d.getDay()]}`;
}

function animFor(code: number) {
  if (code <= 1) return "wx-sun";
  if (code <= 3) return "wx-cloud";
  return "wx-float";
}

export default function WeatherPage() {
  const [lat, setLat] = useState(DEF_LAT);
  const [lng, setLng] = useState(DEF_LNG);
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(false);
  const [now, setNow] = useState(Date.now());

  // restore last picked location
  useEffect(() => {
    try {
      const s = localStorage.getItem("phuquoc-wx-loc");
      if (s) {
        const o = JSON.parse(s);
        if (Number.isFinite(o.lat) && Number.isFinite(o.lng)) {
          setLat(o.lat);
          setLng(o.lng);
        }
      }
    } catch {}
  }, []);

  const load = useCallback(
    (nocache: boolean) => {
      setLoading(true);
      setErr(false);
      const url = `/api/weather?lat=${lat}&lng=${lng}${nocache ? "&nocache=1" : ""}`;
      const attempt = (n: number) => {
        fetch(url)
          .then((r) => (r.ok ? r.json() : Promise.reject()))
          .then((d) => {
            if (d.current) {
              setData(d);
              setLoading(false);
            } else if (n < 2) {
              setTimeout(() => attempt(n + 1), 1500);
            } else {
              setErr(true);
              setLoading(false);
            }
          })
          .catch(() => {
            // transient blip → retry up to 2 times before showing the error
            if (n < 2) setTimeout(() => attempt(n + 1), 1500);
            else {
              setErr(true);
              setLoading(false);
            }
          });
      };
      attempt(0);
    },
    [lat, lng]
  );

  // fetch when location changes
  useEffect(() => {
    load(false);
    try {
      localStorage.setItem("phuquoc-wx-loc", JSON.stringify({ lat, lng }));
      markDirty("phuquoc-wx-loc");
    } catch {}
  }, [lat, lng, load]);

  // auto-refresh every 10 min
  useEffect(() => {
    const id = setInterval(() => load(false), 600000);
    return () => clearInterval(id);
  }, [load]);

  // tick for relative time
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const minsAgo = data?.fetchedAt
    ? Math.max(0, Math.round((now - new Date(data.fetchedAt).getTime()) / 60000))
    : null;

  return (
    <>
      <PageHero
        image="/images/phuquoc-cablecar.jpg"
        eyebrow="WEATHER"
        title="富国岛天气"
        subtitle="实时天气 · 空气质量 · 日出日落 · 未来 5 天（数据 Open-Meteo）"
      />

      <div className="mx-auto max-w-7xl px-4 py-10">
        {/* control bar */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-slate-600 dark:text-slate-300">
            📍 {lat.toFixed(4)}, {lng.toFixed(4)}
            {minsAgo != null && (
              <span className="ml-2 text-xs text-slate-400">· 更新于 {minsAgo} 分钟前</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => load(true)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#FF7A45] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#e6662e] disabled:opacity-50"
          >
            <span className={loading ? "inline-block animate-spin" : ""}>↻</span>
            {loading ? "刷新中…" : "手动刷新"}
          </button>
        </div>

        {/* location picker */}
        <WeatherMap lat={lat} lng={lng} onPick={(la, ln) => { setLat(la); setLng(ln); }} />
        <p className="mt-2 text-xs text-slate-400">
          点击地图任意位置切换地点。天气精度为该坐标所在网格（Open-Meteo 约 1–10 公里级）——任何免费天气服务都到不了街道级，但你可以精确选到想查的那个点。
        </p>

        {err && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
            天气数据获取失败，请稍后重试。
          </div>
        )}
        {!data && !err && loading && (
          <div className="mt-6 h-64 animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-800/60" />
        )}

        {data && (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <CurrentCard data={data} />
                <AirCard data={data} />
              </div>
              <TrendCard data={data} />
            </div>
            <div className="space-y-5">
              <SunCycleCard data={data} />
              <ForecastCard data={data} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/* ---------- current (with CSS weather animations) ---------- */
function CurrentCard({ data }: { data: Data }) {
  const w = wmo(data.current.weather_code);
  const anim = animFor(data.current.weather_code);
  const stats = [
    { label: "体感", value: `${Math.round(data.current.apparent_temperature)}°` },
    { label: "湿度", value: `${data.current.relative_humidity_2m}%` },
    { label: "气压", value: `${Math.round(data.current.pressure_msl)} hPa` },
    { label: "能见度", value: `${(data.current.visibility / 1000).toFixed(1)} km` },
    { label: "风速", value: `${data.current.wind_speed_10m.toFixed(1)} km/h` },
  ];
  return (
    <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-[#FFB088] to-[#FF7A45] p-6 text-white shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/75">
            {dateLabel(data.daily.time[0])}
          </div>
          <div className="mt-1 text-sm text-white/85">{w.text}</div>
        </div>
        <div className={"text-5xl " + anim}>{w.emoji}</div>
      </div>
      <div className="mt-4 flex items-end gap-2">
        <span className="text-6xl font-extrabold leading-none">
          {Math.round(data.current.temperature_2m)}
        </span>
        <span className="mb-1 text-2xl font-light">°C</span>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-white/20 px-3 py-1.5 backdrop-blur-md">
            <div className="text-[10px] uppercase tracking-wider text-white/75">{s.label}</div>
            <div className="text-sm font-semibold">{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- air ---------- */
function AirCard({ data }: { data: Data }) {
  const aqi = data.air?.us_aqi;
  const lvl = aqi != null ? aqiLevel(aqi) : null;
  return (
    <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-[#7EC8C8] to-[#4A9D9D] p-6 text-white shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/75">空气质量</div>
      {aqi != null && lvl ? (
        <>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-5xl font-extrabold leading-none">{Math.round(aqi)}</span>
            <span className="mb-1 text-sm text-white/80">US AQI · {lvl.label}</span>
          </div>
          <div className="mt-1 text-sm text-white/80">PM2.5 {data.air?.pm2_5?.toFixed(0)} μg/m³</div>
          <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-white/25">
            <div className="h-full rounded-full transition-all" style={{ width: `${lvl.pct}%`, background: lvl.color }} />
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-white/70">
            <span>优 0</span>
            <span>严重 300+</span>
          </div>
        </>
      ) : (
        <div className="mt-5 text-sm text-white/85">此地点暂无空气质量数据</div>
      )}
    </div>
  );
}

/* ---------- hourly trend: Recharts AreaChart ---------- */
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";

function TrendCard({ data }: { data: Data }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const today = (data.current.time || data.daily.time[0]).slice(0, 10);
  const pts: { time: string; temp: number; emoji: string; pop: number }[] = [];
  data.hourly.time.forEach((tm, i) => {
    if (tm.startsWith(today) && /T(00|03|06|09|12|15|18|21):00$/.test(tm)) {
      pts.push({
        time: hh(tm),
        temp: data.hourly.temperature_2m[i],
        emoji: wmo(data.hourly.weather_code[i]).emoji,
        pop: data.hourly.precipitation_probability?.[i] ?? 0,
      });
    }
  });
  if (pts.length < 2) return null;

  return (
    <div className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-baseline justify-between">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">今日气温走势</h3>
        <span className="text-xs text-slate-400">{dateLabel(today)}</span>
      </div>

      {/* Recharts AreaChart */}
      <div className="mt-4" style={{ width: "100%", height: 180 }}>
        {mounted ? (
          <ResponsiveContainer>
            <AreaChart data={pts} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-color, #FF7A45)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--chart-color, #FF7A45)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                tick={{ fontSize: 11, fill: "var(--chart-axis)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide domain={["dataMin - 2", "dataMax + 2"]} />
              <Tooltip
                contentStyle={{
                  border: "none",
                  borderRadius: 12,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
                  fontSize: 13,
                  padding: "8px 12px",
                }}
                labelStyle={{ color: "var(--chart-axis)", fontSize: 11 }}
                formatter={(v) => [`${Math.round(Number(v))}°C`, "气温"]}
              />
              <Area
                type="monotone"
                dataKey="temp"
                stroke="var(--chart-color, #FF7A45)"
                strokeWidth={2.5}
                fill="url(#tempGrad)"
                dot={{ fill: "var(--chart-dot)", stroke: "var(--chart-color, #FF7A45)", strokeWidth: 2, r: 3.5 }}
                activeDot={{ r: 5, stroke: "var(--chart-color, #FF7A45)", strokeWidth: 2, fill: "var(--chart-dot)" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
        )}
      </div>

      {/* hourly detail row */}
      <div className="mt-3 grid grid-cols-4 gap-1 text-center sm:grid-cols-8">
        {pts.map((p, i) => (
          <div key={i}>
            <div className="text-[11px] font-bold text-slate-900 dark:text-white">{Math.round(p.temp)}°</div>
            <div className="text-sm">{p.emoji}</div>
            {p.pop > 0 && <div className="text-[9px] text-sky-500">💧{p.pop}%</div>}
            <div className="text-[10px] text-slate-400">{p.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- sunrise/sunset + UV (animated sun traveling along the arc) ---------- */
// Arc: M 10 70 Q 130 -20, 250 70  → quadratic bezier, P0=(10,70) P1=(130,-20) P2=(250,70)
function bez(p: number) {
  const m = 1 - p;
  return {
    x: m * m * 10 + 2 * m * p * 130 + p * p * 250,
    y: m * m * 70 + 2 * m * p * -20 + p * p * 70,
  };
}

function SunCycleCard({ data }: { data: Data }) {
  const rise = data.daily.sunrise[0];
  const set = data.daily.sunset[0];
  const uv = data.current.uv_index ?? data.daily.uv_index_max[0];
  const uvl = uvLevel(uv);

  const nowMs = new Date(data.current.time).getTime();
  const riseMs = new Date(rise).getTime();
  const setMs = new Date(set).getTime();
  const dayProg = Math.max(0, Math.min(1, (nowMs - riseMs) / (setMs - riseMs)));

  // animation progress 0→1, replays whenever fresh data arrives (refresh / auto-poll)
  const [a, setA] = useState(0);
  useEffect(() => {
    setA(0);
    let raf = 0;
    const start = performance.now();
    const dur = 1600;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3); // easeOutCubic
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      setA(ease(t));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [data.fetchedAt]);

  const p = dayProg * a; // sun travels from sunrise (0) to current dayProg as a→1
  const sun = bez(p);
  // de Casteljau control point so the filled arc is the true sub-bezier up to the sun
  const cx = 10 + 120 * p;
  const cy = 70 - 90 * p;

  return (
    <div className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white">日出 · 日落</h3>
      <svg viewBox="0 0 260 80" className="mt-3 w-full">
        {/* horizon line */}
        <line x1="10" y1="70" x2="250" y2="70" stroke="var(--horizon-stroke)" strokeWidth="2" />
        {/* full dashed arc */}
        <path d="M 10 70 Q 130 -20, 250 70" fill="none" stroke="var(--horizon-stroke)" strokeWidth="2" strokeDasharray="4 4" />
        {/* filled arc up to current sun position */}
        <path d={`M 10 70 Q ${cx.toFixed(2)} ${cy.toFixed(2)}, ${sun.x.toFixed(2)} ${sun.y.toFixed(2)}`} fill="none" stroke="#FF7A45" strokeWidth="2.5" strokeLinecap="round" />
        {/* sun glow + core */}
        <circle cx={sun.x} cy={sun.y} r="13" fill="#FFB088" opacity={0.35 + 0.3 * a} />
        <circle cx={sun.x} cy={sun.y} r="8" fill="#FF7A45" />
        {/* endpoints */}
        <circle cx="10" cy="70" r="4" fill="#FFB088" />
        <circle cx="250" cy="70" r="4" fill="#4A5568" />
      </svg>
      <div className="mt-1 flex justify-between text-sm">
        <div>
          <div className="text-xs text-slate-400">日出</div>
          <div className="font-bold text-slate-900 dark:text-white">{hh(rise)}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400">日落</div>
          <div className="font-bold text-slate-900 dark:text-white">{hh(set)}</div>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3 rounded-2xl bg-slate-100 p-4 dark:border dark:border-slate-700 dark:bg-slate-800/60">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FF7A45]/15 text-xl">☀️</div>
        <div className="flex-1">
          <div className="text-lg font-bold text-slate-900 dark:text-white">
            UV {uv.toFixed(0)}{" "}
            <span className="ml-1 rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: uvl.color, color: "#1a1a1a" }}>
              {uvl.label}
            </span>
          </div>
          <div className="text-[11px] text-white/70">紫外线指数 · 近赤道，注意防晒</div>
        </div>
      </div>
    </div>
  );
}

/* ---------- 5-day forecast ---------- */
function ForecastCard({ data }: { data: Data }) {
  const label = (i: number) => (i === 0 ? "今天" : i === 1 ? "明天" : dateLabel(data.daily.time[i]));
  return (
    <div className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white">未来 5 天</h3>
      <div className="mt-4 space-y-2">
        {data.daily.time.map((_, i) => {
          const w = wmo(data.daily.weather_code[i]);
          const rain = data.daily.precipitation_probability_max?.[i];
          return (
            <div key={i} className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/60">
              <div className="w-20 shrink-0">
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">{i < 2 ? label(i) : ""}</div>
                <div className="text-[11px] text-slate-400">{dateLabel(data.daily.time[i])}</div>
              </div>
              <div className="text-2xl">{w.emoji}</div>
              <div className="flex-1 text-xs text-slate-500">
                {w.text}
                {rain != null && <span className="ml-1 text-sky-500">💧{rain}%</span>}
              </div>
              <div className="text-sm font-semibold">
                <span className="text-[#FF7A45]">{Math.round(data.daily.temperature_2m_max[i])}°</span>
                <span className="ml-1 text-slate-400">{Math.round(data.daily.temperature_2m_min[i])}°</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
