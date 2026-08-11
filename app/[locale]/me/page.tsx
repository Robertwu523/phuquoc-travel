"use client";

import { useEffect, useState } from "react";
import { useTripStore } from "@/lib/store";

export default function ProfilePage() {
  const hydrated = useTripStore((s) => s._hasHydrated);
  const days = useTripStore((s) => s.days);
  const dayAssignments = useTripStore((s) => s.dayAssignments);
  const customPins = useTripStore((s) => s.customPins);
  const startDate = useTripStore((s) => s.startDate);
  const clearAll = useTripStore((s) => s.clearAll);

  const [confirmClear, setConfirmClear] = useState(false);
  const [flightCount, setFlightCount] = useState(0);
  const [expenseCount, setExpenseCount] = useState(0);

  useEffect(() => {
    if (!hydrated) return;
    try {
      const f = localStorage.getItem("phuquoc-manual-flights");
      if (f) setFlightCount(JSON.parse(f).length);
      const e = localStorage.getItem("phuquoc-expenses-v1");
      if (e) setExpenseCount(JSON.parse(e).length);
    } catch {}
  }, [hydrated]);

  const totalStops = Object.values(dayAssignments).reduce((s, l) => s + l.length, 0);
  const totalCustomPins = Object.keys(customPins).length;

  function exportData() {
    const data: Record<string, unknown> = {};
    try {
      for (const key of [
        "phu-quoc-trip-v2",
        "phuquoc-manual-flights",
        "phuquoc-expenses-v1",
        "phuquoc-doc-checklist-v3",
        "phuquoc-wx-loc",
      ]) {
        const v = localStorage.getItem(key);
        if (v) data[key] = JSON.parse(v);
      }
    } catch {}
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `phuquoc-travel-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function clearAllData() {
    [
      "phu-quoc-trip-v2",
      "phuquoc-manual-flights",
      "phuquoc-expenses-v1",
      "phuquoc-doc-checklist-v3",
      "phuquoc-doc-checklist-v2",
      "phuquoc-wx-loc",
    ].forEach((k) => localStorage.removeItem(k));
    clearAll();
    location.reload();
  }

  const stats = [
    { label: "行程天数", value: days, emoji: "📅" },
    { label: "行程景点", value: totalStops, emoji: "📍" },
    { label: "自定义地点", value: totalCustomPins, emoji: "📌" },
    { label: "航班记录", value: flightCount, emoji: "✈️" },
    { label: "记账笔数", value: expenseCount, emoji: "💰" },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      {/* header */}
      <div className="rounded-2xl bg-gradient-to-br from-[#FFB088] to-[#FF7A45] p-6 text-center text-white">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-3xl backdrop-blur">
          🏝️
        </div>
        <h1 className="mt-3 text-xl font-extrabold">富国岛旅行助手</h1>
        <p className="text-sm text-white/80">
          出发日期：{startDate || "待定"} · {days} 天行程
        </p>
      </div>

      {/* stats */}
      <div>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-400">数据统计</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-slate-200 bg-white p-4 text-center dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="text-2xl">{s.emoji}</div>
              <div className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">{s.value}</div>
              <div className="text-[10px] text-slate-400">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* data management */}
      <div>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-400">数据管理</h2>
        <div className="space-y-2">
          <button
            type="button"
            onClick={exportData}
            disabled={!hydrated}
            className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-[#FF7A45] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            <span>📥 导出全部数据（JSON）</span>
            <span className="text-slate-400">→</span>
          </button>

          {!confirmClear ? (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="flex w-full items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-100 dark:bg-red-950/20"
            >
              <span>🗑️ 清空所有数据</span>
              <span className="text-red-400">→</span>
            </button>
          ) : (
            <div className="rounded-xl border border-red-300 bg-red-50 p-4 dark:bg-red-950/20">
              <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                ⚠️ 确认清空？行程、记账、航班、清单全部删除，不可恢复。
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={clearAllData}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
                >
                  确认清空
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 dark:border-slate-600"
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* about */}
      <div className="rounded-xl bg-slate-100 p-4 text-center text-xs text-slate-400 dark:bg-slate-800/60">
        富国岛旅行助手 · 数据均存于本机浏览器（localStorage）· 不上传服务器
      </div>
    </div>
  );
}
