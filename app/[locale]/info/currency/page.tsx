"use client";

import { useEffect, useState } from "react";
import PageHero from "@/components/PageHero";

type Rates = { base: string; rates: Record<string, number>; time: string | null };

const CURS = [
  { code: "HKD", flag: "🇭🇰", name: "港元" },
  { code: "CNY", flag: "🇨🇳", name: "人民币" },
  { code: "USD", flag: "🇺🇸", name: "美元" },
  { code: "VND", flag: "🇻🇳", name: "越南盾" },
];

function fmt(code: string, v: number) {
  if (!Number.isFinite(v)) return "—";
  // 4 decimals for all — also fixes tiny cross-rates (e.g. 1 VND = 0.0003 HKD)
  return v.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
}

const TIPS = [
  { k: "现金为王", v: "小店、夜市、出租车多只收现金，建议多带越南盾。面额大、零多，付款时数清零的个数。" },
  { k: "信用卡", v: "酒店、大餐厅可刷 Visa / Mastercard；银联覆盖较少。建议带两张，一主一备。" },
  { k: "兑换 / ATM", v: "机场和阳东镇换汇点多；ATM 取现方便（注意手续费与单次限额）。机场汇率略差，急用再换。" },
  { k: "移动支付", v: "游客区部分支持支付宝 / 微信，但别指望，仍以现金为主。" },
  { k: "小费", v: "非强制；服务好可给 5–10% 或 1–2 万 VND。" },
  { k: "防坑提醒", v: "1,000,000 VND ≈ 300 港元——零太多，容易多付一个零。大额付款务必核对。" },
];

const PRICES = [
  { item: "越南米粉（一碗）", vnd: 50000 },
  { item: "本地啤酒", vnd: 30000 },
  { item: "椰子 / 鲜榨果汁", vnd: 40000 },
  { item: "摩托租赁（天）", vnd: 200000 },
  { item: "按摩（1 小时）", vnd: 300000 },
  { item: "跳岛一日游", vnd: 450000 },
];

const NOTES = "1,000 · 2,000 · 5,000 · 10,000 · 20,000 · 50,000 · 100,000 · 200,000 · 500,000 ₫";

export default function CurrencyPage() {
  const [r, setR] = useState<Rates | null>(null);
  const [err, setErr] = useState(false);
  const [amount, setAmount] = useState("100");
  const [from, setFrom] = useState("HKD");
  const [to, setTo] = useState("VND");

  useEffect(() => {
    fetch("/api/rates")
      .then((x) => (x.ok ? x.json() : Promise.reject()))
      .then((d) => (d.rates ? setR(d) : setErr(true)))
      .catch(() => setErr(true));
  }, []);

  const amt = Number(amount) || 0;
  const rf = r?.rates?.[from];
  const rt = r?.rates?.[to];
  const result = rf && rt ? (amt * rt) / rf : null;
  const perUnit = rf && rt ? rt / rf : null;

  function swap() {
    setFrom(to);
    setTo(from);
  }

  return (
    <>
      <PageHero
        image="/images/phuquoc-town.jpg"
        eyebrow="CURRENCY"
        title="货币与汇率"
        subtitle="实时汇率 · 货币换算 · 越南盾使用指南（数据：open.er-api.com）"
      />

      <div className="mx-auto max-w-5xl px-4 py-12">
        {/* ===== converter (xe-style) ===== */}
        <div className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">货币换算</h2>
            <span className="text-[11px] text-slate-400">
              {r?.time ? `更新于 ${new Date(r.time).toLocaleDateString("zh-CN")}` : "加载中…"}
            </span>
          </div>

          <div className="mt-5 grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
            <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">金额</div>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-transparent text-2xl font-bold text-slate-900 focus:outline-none dark:text-white"
              />
              <select
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {CURS.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code} · {c.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={swap}
              aria-label="swap"
              className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#FF7A45] text-white shadow-sm transition hover:bg-[#e6662e]"
            >
              ⇄
            </button>

            <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">兑换为</div>
              <div className="text-2xl font-bold text-[#FF7A45]">
                {result != null ? fmt(to, result) : "—"}
              </div>
              <select
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {CURS.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code} · {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {perUnit != null && (
            <div className="mt-4 rounded-lg bg-slate-50 px-4 py-2 text-sm text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
              1 {from} = <span className="font-semibold text-slate-900 dark:text-white">{fmt(to, perUnit)} {to}</span>
              {" · "}
              1 {to} = <span className="font-semibold text-slate-900 dark:text-white">{fmt(from, 1 / perUnit)} {from}</span>
            </div>
          )}
          {err && <div className="mt-3 text-sm text-red-600">汇率获取失败，请稍后重试。</div>}
        </div>

        {/* ===== key rate cards ===== */}
        <h2 className="mt-10 text-lg font-bold text-slate-900 dark:text-white">关键汇率</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {[
            { f: "HKD", t: "VND" },
            { f: "CNY", t: "VND" },
            { f: "USD", t: "VND" },
          ].map(({ f, t }) => {
            const rf2 = r?.rates?.[f];
            const rt2 = r?.rates?.[t];
            const v = rf2 && rt2 ? rt2 / rf2 : null;
            const flag = CURS.find((c) => c.code === f)?.flag;
            return (
              <div key={f} className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="text-3xl">{flag}</div>
                <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
                  {v != null ? fmt(t, v) : "—"}
                </div>
                <div className="text-xs text-slate-500">1 {f} = {v != null ? fmt(t, v) : "—"} {t}</div>
              </div>
            );
          })}
        </div>

        {/* ===== common prices (converted) ===== */}
        <h2 className="mt-10 text-lg font-bold text-slate-900 dark:text-white">富国岛常见物价</h2>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-800/60">
              <tr>
                <th className="px-4 py-3">项目</th>
                <th className="px-4 py-3">越南盾</th>
                <th className="px-4 py-3">约港元</th>
                <th className="px-4 py-3">约人民币</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {PRICES.map((p) => {
                const hkd = r?.rates?.HKD && r?.rates?.VND ? p.vnd * r.rates.HKD / r.rates.VND : null;
                const cny = r?.rates?.CNY && r?.rates?.VND ? p.vnd * r.rates.CNY / r.rates.VND : null;
                return (
                  <tr key={p.item}>
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{p.item}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{p.vnd.toLocaleString()} ₫</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{hkd != null ? `HK$${hkd.toFixed(1)}` : "—"}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{cny != null ? `¥${cny.toFixed(1)}` : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ===== VND guide ===== */}
        <h2 className="mt-10 text-lg font-bold text-slate-900 dark:text-white">越南盾使用指南</h2>
        <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">越南盾 VND · 符号 ₫</div>
          <div className="mt-1 text-sm text-slate-700 dark:text-slate-200">纸币面额：{NOTES}</div>
          <ul className="mt-4 space-y-2.5">
            {TIPS.map((t) => (
              <li key={t.k} className="text-sm leading-relaxed">
                <span className="font-semibold text-[#FF7A45]">{t.k}：</span>
                <span className="text-slate-600 dark:text-slate-300">{t.v}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-6 text-xs text-slate-400">
          汇率每小时更新一次（open.er-api.com 免费源，约每日更新）；实际换汇以银行 / 换汇点牌价为准。
        </p>
      </div>
    </>
  );
}
