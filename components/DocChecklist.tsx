"use client";

import { useEffect, useState } from "react";

const KEY = "phuquoc-doc-checklist-v1";

export default function DocChecklist({ items }: { items: string[] }) {
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setChecked(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  function toggle(i: number) {
    setChecked((c) => {
      const next = { ...c, [i]: !c[i] };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  const done = Object.values(checked).filter(Boolean).length;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {done}/{items.length}
        </span>
        <div className="h-1.5 w-32 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className="h-full bg-teal-600 transition-all"
            style={{ width: `${items.length ? (done / items.length) * 100 : 0}%` }}
          />
        </div>
      </div>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => toggle(i)}
              className="flex w-full items-start gap-2.5 rounded-lg p-1.5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
            >
              <span
                className={
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs " +
                  (checked[i]
                    ? "border-teal-600 bg-teal-600 text-white"
                    : "border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800")
                }
              >
                {checked[i] ? "✓" : ""}
              </span>
              <span
                className={
                  "text-sm " +
                  (checked[i]
                    ? "text-slate-400 line-through"
                    : "text-slate-700 dark:text-slate-200")
                }
              >
                {it}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
