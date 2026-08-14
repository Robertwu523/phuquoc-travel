"use client";

import { useEffect, useState } from "react";
import { markDirty } from "@/lib/sync";

type Currency = "VND" | "HKD" | "USD" | "CNY";
type Category = "food" | "transport" | "hotel" | "activity" | "shopping" | "other";

type Expense = {
  id: string;
  amount: number;
  currency: Currency;
  category: Category;
  day: number | null;
  note: string;
};

const KEY = "phuquoc-expenses-v1";
const BUDGET_KEY = "phuquoc-budget-v1";

const CATS: { key: Category; emoji: string; label: string; color: string }[] = [
  { key: "food", emoji: "🍜", label: "餐饮", color: "#FF7A45" },
  { key: "transport", emoji: "🚕", label: "交通", color: "#3B82F6" },
  { key: "hotel", emoji: "🏨", label: "住宿", color: "#8B5CF6" },
  { key: "activity", emoji: "🎫", label: "景点", color: "#10B981" },
  { key: "shopping", emoji: "🛍️", label: "购物", color: "#F59E0B" },
  { key: "other", emoji: "📦", label: "其他", color: "#6B7280" },
];

const CURS: { code: Currency; flag: string; name: string }[] = [
  { code: "VND", flag: "🇻🇳", name: "越南盾" },
  { code: "HKD", flag: "🇭🇰", name: "港元" },
  { code: "USD", flag: "🇺🇸", name: "美元" },
  { code: "CNY", flag: "🇨🇳", name: "人民币" },
];

export default function ExpenseTracker({ days }: { days: number }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budget, setBudget] = useState<number>(0);
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [ratesTime, setRatesTime] = useState<string>("");
  const [showAdd, setShowAdd] = useState(false);

  // form state
  const [fAmount, setFAmount] = useState("");
  const [fCurrency, setFCurrency] = useState<Currency>("VND");
  const [fCategory, setFCategory] = useState<Category>("food");
  const [fDay, setFDay] = useState<number | null>(0);
  const [fNote, setFNote] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setExpenses(JSON.parse(raw));
      const b = localStorage.getItem(BUDGET_KEY);
      if (b) setBudget(Number(b) || 0);
    } catch {
      /* ignore */
    }
    fetch("/api/rates")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        if (d.rates) {
          setRates(d.rates);
          setRatesTime(d.time ?? "");
        }
      })
      .catch(() => {});
  }, []);

  function save(list: Expense[]) {
    setExpenses(list);
    try {
      localStorage.setItem(KEY, JSON.stringify(list));
      markDirty(KEY);
    } catch {
      /* ignore */
    }
  }

  function saveBudget(v: number) {
    setBudget(v);
    try {
      localStorage.setItem(BUDGET_KEY, String(v));
      markDirty(BUDGET_KEY);
    } catch {
      /* ignore */
    }
  }

  // convert any currency to CNY using rates (base HKD)
  function toCNY(amount: number, cur: Currency): number {
    if (!rates) return cur === "CNY" ? amount : 0;
    if (cur === "CNY") return amount;
    const rateCur = rates[cur];
    const rateCNY = rates.CNY;
    if (!rateCur || !rateCNY) return 0;
    return (amount * rateCNY) / rateCur;
  }

  function fmtCNY(v: number): string {
    return `¥${v.toFixed(2)}`;
  }

  function fmtOrig(amount: number, cur: Currency): string {
    const sym: Record<Currency, string> = { VND: "₫", HKD: "HK$", USD: "$", CNY: "¥" };
    return `${sym[cur]}${amount.toLocaleString("en-US", { maximumFractionDigits: cur === "VND" ? 0 : 2 })}`;
  }

  function addExpense() {
    const amt = Number(fAmount);
    if (!amt || amt <= 0) return;
    const exp: Expense = {
      id: `exp-${Date.now()}`,
      amount: amt,
      currency: fCurrency,
      category: fCategory,
      day: fDay,
      note: fNote.trim(),
    };
    save([exp, ...expenses]);
    setFAmount("");
    setFNote("");
    setShowAdd(false);
  }

  function deleteExpense(id: string) {
    save(expenses.filter((e) => e.id !== id));
  }

  const totalCNY = expenses.reduce((sum, e) => sum + toCNY(e.amount, e.currency), 0);
  const remaining = budget - totalCNY;
  const pct = budget > 0 ? Math.min(100, (totalCNY / budget) * 100) : 0;
  const overBudget = budget > 0 && totalCNY > budget;

  // category breakdown
  const catTotals = CATS.map((c) => ({
    ...c,
    total: expenses.filter((e) => e.category === c.key).reduce((s, e) => s + toCNY(e.amount, e.currency), 0),
  })).filter((c) => c.total > 0);
  const maxCatTotal = Math.max(...catTotals.map((c) => c.total), 1);

  // per-day totals
  const dayTotals = Array.from({ length: days }, (_, i) => ({
    day: i,
    total: expenses.filter((e) => e.day === i).reduce((s, e) => s + toCNY(e.amount, e.currency), 0),
  }));

  return (
    <div className="space-y-4">
      {/* budget + summary */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              旅行预算
            </div>
            <div className="mt-1 text-3xl font-extrabold text-[#FF7A45]">{fmtCNY(totalCNY)}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {budget > 0
                ? overBudget
                  ? `超支 ${fmtCNY(Math.abs(remaining))}`
                  : `剩余 ${fmtCNY(remaining)}`
                : "未设预算"}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <label className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              预算 ¥
              <input
                type="number"
                value={budget || ""}
                onChange={(e) => saveBudget(Number(e.target.value) || 0)}
                placeholder="5000"
                className="w-20 rounded-md border border-slate-300 bg-white px-2 py-1 text-right text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#FF7A45] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </label>
          </div>
        </div>
        {budget > 0 && (
          <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className={"h-full rounded-full transition-all " + (overBudget ? "bg-red-400" : "bg-[#FF7A45]")}
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
        {ratesTime && (
          <div className="mt-2 text-[10px] text-slate-400">
            汇率更新于 {new Date(ratesTime).toLocaleDateString("zh-CN")} · 1 HKD = {(rates?.VND ?? 0).toFixed(0)} VND
          </div>
        )}
      </div>

      {/* category breakdown */}
      {catTotals.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">分类支出</div>
          <div className="mt-2 space-y-1.5">
            {catTotals
              .sort((a, b) => b.total - a.total)
              .map((c) => (
                <div key={c.key} className="flex items-center gap-2">
                  <span className="w-24 shrink-0 text-xs text-slate-600 dark:text-slate-300">
                    {c.emoji} {c.label}
                  </span>
                  <div className="h-5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="flex h-full items-center justify-end rounded-full px-2 text-[10px] font-bold text-white"
                      style={{ width: `${(c.total / maxCatTotal) * 100}%`, background: c.color }}
                    >
                      {fmtCNY(c.total)}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* add button */}
      <button
        type="button"
        onClick={() => setShowAdd((v) => !v)}
        className="w-full rounded-xl border border-dashed border-[#FF7A45] py-2.5 text-sm font-semibold text-[#FF7A45] transition hover:bg-orange-50 dark:hover:bg-orange-950/20"
      >
        {showAdd ? "取消" : "+ 记一笔"}
      </button>

      {/* add form */}
      {showAdd && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              type="number"
              value={fAmount}
              onChange={(e) => setFAmount(e.target.value)}
              placeholder="金额"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <select
              value={fCurrency}
              onChange={(e) => setFCurrency(e.target.value as Currency)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              {CURS.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.code} {c.name}
                </option>
              ))}
            </select>
            <select
              value={fCategory}
              onChange={(e) => setFCategory(e.target.value as Category)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              {CATS.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.emoji} {c.label}
                </option>
              ))}
            </select>
            <select
              value={fDay ?? ""}
              onChange={(e) => setFDay(e.target.value === "" ? null : Number(e.target.value))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="">无关联天数</option>
              {Array.from({ length: days }, (_, i) => (
                <option key={i} value={i}>
                  第 {i + 1} 天
                </option>
              ))}
            </select>
            <input
              value={fNote}
              onChange={(e) => setFNote(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addExpense()}
              placeholder="备注（如：海鲜大餐）"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div className="mt-2 flex items-center justify-between">
            {fAmount && rates && (
              <span className="text-xs text-slate-400">
                ≈ {fmtCNY(toCNY(Number(fAmount), fCurrency))}
              </span>
            )}
            <button
              type="button"
              onClick={addExpense}
              className="ml-auto rounded-lg bg-[#FF7A45] px-5 py-2 text-sm font-bold text-white transition hover:bg-[#e6662e]"
            >
              保存
            </button>
          </div>
        </div>
      )}

      {/* expense list */}
      {expenses.length > 0 ? (
        <div className="space-y-1.5">
          {expenses.map((e) => {
            const cat = CATS.find((c) => c.key === e.category)!;
            const cny = toCNY(e.amount, e.currency);
            return (
              <div
                key={e.id}
                className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base"
                  style={{ background: cat.color + "20" }}
                >
                  {cat.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {fmtOrig(e.amount, e.currency)}
                    </span>
                    <span className="text-xs text-[#FF7A45]">≈ {fmtCNY(cny)}</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    {cat.label}
                    {e.day != null && ` · 第 ${e.day + 1} 天`}
                    {e.note && ` · ${e.note}`}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => deleteExpense(e.id)}
                  className="shrink-0 px-1.5 text-xs text-slate-300 opacity-0 transition hover:text-red-500 group-hover:opacity-100 max-md:opacity-100"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="py-4 text-center text-sm text-slate-400">还没有记账，点上方"+ 记一笔"开始。</p>
      )}
    </div>
  );
}
