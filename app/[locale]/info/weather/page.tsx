"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import PageHero from "@/components/PageHero";
import { wmo, aqiLevel, uvLevel } from "@/lib/weatherCodes";

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
  air: { pm2_5: number; us_aqi: number };
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
      fetch(`/api/weather?lat=${lat}&lng=${lng}${nocache ? "&nocache=1" : ""}`)
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((d) => (d.current ? setData(d) : setErr(true)))
        .catch(() => setErr(true))
        .finally(() => setLoading(false));
    },
    [lat, lng]
  );

  // fetch when location changes
  useEffect(() => {
    load(false);
    try {
      localStorage.setItem("phuquoc-wx-loc", JSON.stringify({ lat, lng }));
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
  const aqi = data.air.us_aqi ?? 0;
  const lvl = aqiLevel(aqi);
  return (
    <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-[#7EC8C8] to-[#4A9D9D] p-6 text-white shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/75">空气质量</div>
      <div className="mt-2 flex items-end gap-2">
        <span className="text-5xl font-extrabold leading-none">{Math.round(aqi)}</span>
        <span className="mb-1 text-sm text-white/80">US AQI · {lvl.label}</span>
      </div>
      <div className="mt-1 text-sm text-white/80">PM2.5 {data.air.pm2_5?.toFixed(0)} μg/m³</div>
      <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-white/25">
        <div className="h-full rounded-full transition-all" style={{ width: `${lvl.pct}%`, background: lvl.color }} />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-white/70">
        <span>优 0</span>
        <span>严重 300+</span>
      </div>
    </div>
  );
}

/* ---------- hourly trend: SVG line chart ---------- */
function TrendCard({ data }: { data: Data }) {
  const today = (data.current.time || data.daily.time[0]).slice(0, 10);
  // sample every 3h: 00,03,...,21
  const pts: { t: string; temp: number; code: number; pop: number }[] = [];
  data.hourly.time.forEach((tm, i) => {
    if (tm.startsWith(today) && /T(00|03|06|09|12|15|18|21):00$/.test(tm)) {
      pts.push({
        t: hh(tm),
        temp: data.hourly.temperature_2m[i],
        code: data.hourly.weather_code[i],
        pop: data.hourly.precipitation_probability?.[i] ?? 0,
      });
    }
  });
  if (pts.length < 2) return null;

  const W = 100;
  const H = 42;
  const temps = pts.map((p) => p.temp);
  const min = Math.min(...temps);
  const max = Math.max(...temps);
  const pad = Math.max(1, (max - min) * 0.2);
  const lo = min - pad;
  const hi = max + pad;
  const xy = pts.map((p, i) => {
    const x = (i / (pts.length - 1)) * W;
    const y = H - ((p.temp - lo) / (hi - lo)) * H;
    return { x, y, p };
  });
  const line = xy.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(2)} ${c.y.toFixed(2)}`).join(" ");
  const area = `${line} L ${W} ${H} L 0 ${H} Z`;

  return (
    <div className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-baseline justify-between">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">今日气温走势</h3>
        <span className="text-xs text-slate-400">{dateLabel(today)}</span>
      </div>
      <div className="mt-4">
        <svg viewBox={`0 0 ${W} ${H + 12}`} preserveAspectRatio="none" className="h-40 w-full">
          <defs>
            <linearGradient id="wxarea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF7A45" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#FF7A45" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#wxarea)" />
          <path d={line} fill="none" stroke="#FF7A45" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          {xy.map((c, i) => (
            <circle key={i} cx={c.x} cy={c.y} r="1.1" fill="#fff" stroke="#FF7A45" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          ))}
        </svg>
      </div>
      <div className="mt-2 grid grid-cols-8 gap-1 text-center">
        {pts.map((p, i) => (
          <div key={i}>
            <div className="text-[11px] font-bold text-slate-900 dark:text-white">{Math.round(p.temp)}°</div>
            <div className="text-sm">{wmo(p.code).emoji}</div>
            {p.pop > 0 && <div className="text-[9px] text-sky-500">💧{p.pop}%</div>}
            <div className="text-[10px] text-slate-400">{p.t}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- sunrise/sunset + UV ---------- */
function SunCycleCard({ data }: { data: Data }) {
  const rise = data.daily.sunrise[0];
  const set = data.daily.sunset[0];
  const uv = data.current.uv_index ?? data.daily.uv_index_max[0];
  const uvl = uvLevel(uv);
  const nowMs = new Date(data.current.time).getTime();
  const riseMs = new Date(rise).getTime();
  const setMs = new Date(set).getTime();
  const prog = Math.max(0, Math.min(1, (nowMs - riseMs) / (setMs - riseMs)));
  const sunX = 10 + prog * 240;
  const sunY = 70 - Math.sin(prog * Math.PI) * 55;
  return (
    <div className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white">日出 · 日落</h3>
      <svg viewBox="0 0 260 80" className="mt-3 w-full">
        <path d="M 10 70 Q 130 -20, 250 70" fill="none" stroke="#E2E8F0" strokeWidth="2" strokeDasharray="4 4" />
        <path d={`M 10 70 Q 130 -20, ${sunX} ${sunY}`} fill="none" stroke="#FF7A45" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="10" y1="70" x2="250" y2="70" stroke="#E2E8F0" strokeWidth="2" />
        <circle cx={sunX} cy={sunY} r="8" fill="#FF7A45" />
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
      <div className="mt-4 flex items-center gap-3 rounded-2xl bg-slate-900 p-4 text-white">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-xl">☀️</div>
        <div className="flex-1">
          <div className="text-lg font-bold">
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
