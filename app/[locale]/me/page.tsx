"use client";

import { useEffect, useState } from "react";
import { useTripStore } from "@/lib/store";
import { useAuth } from "@/components/AuthProvider";
import { SYNC_KEYS } from "@/lib/sync";
import { Link } from "@/i18n/navigation";

export default function ProfilePage() {
  const hydrated = useTripStore((s) => s._hasHydrated);
  const days = useTripStore((s) => s.days);
  const dayAssignments = useTripStore((s) => s.dayAssignments);
  const customPins = useTripStore((s) => s.customPins);
  const startDate = useTripStore((s) => s.startDate);
  const clearAll = useTripStore((s) => s.clearAll);
  const { user, syncStatus, lastSyncAt, syncNow, signOut } = useAuth();

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
      for (const key of SYNC_KEYS) {
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
    [...SYNC_KEYS, "phuquoc-doc-checklist-v2"].forEach((k) => localStorage.removeItem(k));
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

      {/* account + sync */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        {user ? (
          <>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">已登录账号</div>
                <div className="truncate text-sm font-bold text-slate-900 dark:text-white">{user.email}</div>
              </div>
              <span className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full bg-teal-600 text-sm font-bold text-white">
                {(user.email ?? "?").charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs">
              <span className={
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium " +
                (syncStatus === "syncing" ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                  : syncStatus === "error" ? "bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-300"
                  : "bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300")
              }>
                {syncStatus === "syncing" ? "🔄 同步中…" : syncStatus === "error" ? "⚠️ 同步失败" : "☁️ 已同步"}
              </span>
              {lastSyncAt && (
                <span className="text-slate-400">
                  上次同步 {new Date(lastSyncAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => syncNow()}
                disabled={syncStatus === "syncing"}
                className="flex-1 rounded-lg bg-[#FF7A45] py-2 text-xs font-bold text-white transition hover:bg-[#e6662e] disabled:opacity-50"
              >
                {syncStatus === "syncing" ? "同步中…" : "立即同步"}
              </button>
              <button
                type="button"
                onClick={() => signOut()}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                退出登录
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xl dark:bg-teal-950/40">
                ☁️
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-slate-900 dark:text-white">登录后跨设备同步</div>
                <p className="mt-0.5 text-xs text-slate-400">
                  注册一个账号，行程、记账、清单会在所有设备间自动同步。
                </p>
              </div>
            </div>
            <Link
              href="/auth"
              className="mt-3 block rounded-lg bg-[#FF7A45] py-2 text-center text-sm font-bold text-white transition hover:bg-[#e6662e]"
            >
              登录 / 注册
            </Link>
          </>
        )}
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
        富国岛旅行助手 ·{" "}
        {user ? "数据已同步至云端（仅你自己可见）· 登出后本机仍可离线使用" : "数据存于本机浏览器 · 登录后可跨设备同步"}
      </div>
    </div>
  );
}
