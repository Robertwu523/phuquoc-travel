"use client";

import { useEffect, useState } from "react";
import type { ChecklistGroup } from "@/data/documents";

const KEY = "phuquoc-doc-checklist-v2";

export default function DocChecklist({ groups }: { groups: ChecklistGroup[] }) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setChecked(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const flat = groups.flatMap((g) => g.items.map((item) => ({ group: g.name, item })));
  const done = flat.filter((x) => checked[x.item]).length;
  const total = flat.length;
  const allDone = total > 0 && done === total;

  function toggle(item: string) {
    setChecked((c) => {
      const next = { ...c, [item]: !c[item] };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  return (
    <div>
      {/* master progress */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          {allDone ? "🎉 全部准备完成，可以出发！" : `已完成 ${done}/${total}`}
        </div>
        <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className="h-full rounded-full bg-[#FF7A45] transition-all"
            style={{ width: `${total ? (done / total) * 100 : 0}%` }}
          />
        </div>
      </div>

      {groups.map((g) => {
        const gDone = g.items.filter((it) => checked[it]).length;
        return (
          <div key={g.name} className="mt-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {g.emoji} {g.name}
              </div>
              <div className="text-[11px] text-slate-400">
                {gDone}/{g.items.length}
              </div>
            </div>
            <ul className="mt-1.5 space-y-1">
              {g.items.map((it) => {
                const on = checked[it];
                return (
                  <li key={it}>
                    <button
                      type="button"
                      onClick={() => toggle(it)}
                      className="flex w-full items-start gap-2.5 rounded-lg p-1.5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    >
                      <span
                        className={
                          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs " +
                          (on
                            ? "border-[#FF7A45] bg-[#FF7A45] text-white"
                            : "border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800")
                        }
                      >
                        {on ? "✓" : ""}
                      </span>
                      <span
                        className={
                          "text-sm " +
                          (on
                            ? "text-slate-400 line-through"
                            : "text-slate-700 dark:text-slate-200")
                        }
                      >
                        {it}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
