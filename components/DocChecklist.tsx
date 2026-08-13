"use client";

import { useEffect, useState } from "react";
import type { ChecklistGroup } from "@/data/documents";
import { markDirty } from "@/lib/sync";

const KEY = "phuquoc-doc-checklist-v3";

type Item = { id: string; text: string; group: string; custom: boolean };

export default function DocChecklist({ groups }: { groups: ChecklistGroup[] }) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [items, setItems] = useState<Item[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editGroup, setEditGroup] = useState("");
  const [newItem, setNewItem] = useState("");
  const [newGroup, setNewGroup] = useState(groups[0]?.name ?? "");
  const [customGroupName, setCustomGroupName] = useState("");

  // init: build preset items + load full state (including edits/deletions) from localStorage
  useEffect(() => {
    const preset: Item[] = groups.flatMap((g) =>
      g.items.map((it, idx) => ({
        id: `preset-${g.name}-${idx}`,
        text: it,
        group: g.name,
        custom: false,
      }))
    );
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const data = JSON.parse(raw);
        // v3: full items array saved (preserves edits/deletions to preset items)
        if (data.items && Array.isArray(data.items)) {
          setItems(data.items);
          setChecked(data.checked ?? {});
          return;
        }
      }
    } catch {
      /* ignore */
    }
    setItems(preset);
  }, [groups]);

  function persist(c: Record<string, boolean>, all: Item[]) {
    setChecked(c);
    setItems(all);
    try {
      // save FULL items array (preserves edits/deletions to both preset & custom)
      localStorage.setItem(KEY, JSON.stringify({ checked: c, items: all }));
      markDirty(KEY);
    } catch {
      /* ignore */
    }
  }

  function toggle(id: string) {
    persist({ ...checked, [id]: !checked[id] }, items);
  }

  function addItem() {
    const text = newItem.trim();
    if (!text) return;
    const group = newGroup === "__custom__" ? (customGroupName.trim() || "其他") : newGroup;
    const item: Item = { id: `custom-${Date.now()}`, text, group, custom: true };
    persist(checked, [...items, item]);
    setNewItem("");
    setCustomGroupName("");
  }

  function deleteItem(id: string) {
    const next = items.filter((i) => i.id !== id);
    const c = { ...checked };
    delete c[id];
    persist(c, next);
    if (editingId === id) setEditingId(null);
  }

  function startEdit(item: Item) {
    setEditingId(item.id);
    setEditText(item.text);
    setEditGroup(item.group);
  }

  function saveEdit() {
    if (!editingId) return;
    const text = editText.trim();
    if (!text) return;
    const next = items.map((i) => (i.id === editingId ? { ...i, text, group: editGroup } : i));
    persist(checked, next);
    setEditingId(null);
  }

  // build display groups
  const groupMeta = new Map<string, string>(); // name -> emoji
  groups.forEach((g) => groupMeta.set(g.name, g.emoji));
  const allGroupNames: string[] = [];
  for (const it of items) {
    if (!allGroupNames.includes(it.group)) allGroupNames.push(it.group);
    if (!groupMeta.has(it.group)) groupMeta.set(it.group, "📌");
  }

  const done = items.filter((i) => checked[i.id]).length;
  const total = items.length;
  const allDone = total > 0 && done === total;

  const selectOptions = [...groups.map((g) => g.name), ...allGroupNames.filter((n) => !groups.some((g) => g.name === n))];

  return (
    <div>
      {/* progress */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          {allDone ? "🎉 全部准备完成，可以出发！" : `已完成 ${done}/${total}`}
        </div>
        <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div className="h-full rounded-full bg-[#FF7A45] transition-all" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
        </div>
      </div>

      {/* groups */}
      {allGroupNames.map((gName) => {
        const gItems = items.filter((i) => i.group === gName);
        if (gItems.length === 0) return null;
        const emoji = groupMeta.get(gName) ?? "📌";
        const gDone = gItems.filter((i) => checked[i.id]).length;
        return (
          <div key={gName} className="mt-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {emoji} {gName}
              </div>
              <div className="text-[11px] text-slate-400">{gDone}/{gItems.length}</div>
            </div>
            <ul className="mt-1.5 space-y-1">
              {gItems.map((item) => {
                const on = !!checked[item.id];
                const isEditing = editingId === item.id;
                return (
                  <li key={item.id} className="group flex items-center gap-2.5 rounded-lg p-1.5 transition hover:bg-slate-50 dark:hover:bg-slate-800/60">
                    {isEditing ? (
                      <div className="flex flex-1 flex-col gap-1.5 sm:flex-row">
                        <input
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                          className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm focus:border-[#FF7A45] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                          autoFocus
                        />
                        <select
                          value={editGroup}
                          onChange={(e) => setEditGroup(e.target.value)}
                          className="rounded border border-slate-300 px-1.5 py-1 text-xs focus:border-[#FF7A45] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        >
                          {selectOptions.map((g) => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                        <button type="button" onClick={saveEdit} className="rounded bg-teal-600 px-2 py-1 text-xs font-semibold text-white hover:bg-teal-700">保存</button>
                        <button type="button" onClick={() => setEditingId(null)} className="rounded px-2 py-1 text-xs text-slate-400 hover:text-slate-600">取消</button>
                      </div>
                    ) : (
                      <>
                        <button type="button" onClick={() => toggle(item.id)} className="flex flex-1 items-start gap-2.5 text-left">
                          <span className={"mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs " + (on ? "border-[#FF7A45] bg-[#FF7A45] text-white" : "border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800")}>
                            {on ? "✓" : ""}
                          </span>
                          <span className={"text-sm " + (on ? "text-slate-400 line-through" : "text-slate-700 dark:text-slate-200")}>
                            {item.text}
                          </span>
                        </button>
                        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100 max-md:opacity-100">
                          <button type="button" onClick={() => startEdit(item)} className="rounded px-1.5 py-0.5 text-[10px] text-slate-400 hover:text-[#FF7A45]" aria-label="edit">✏️</button>
                          <button type="button" onClick={() => deleteItem(item.id)} className="rounded px-1.5 py-0.5 text-[10px] text-slate-400 hover:text-red-500" aria-label="delete">✕</button>
                        </div>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}

      {/* add */}
      <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-3 dark:border-slate-700">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500">✏️ 添加自定义项</div>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem()}
            placeholder="输入准备项…"
            className="flex-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#FF7A45] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
          <div className="flex gap-1.5">
            <select
              value={newGroup}
              onChange={(e) => setNewGroup(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700 focus:border-[#FF7A45] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              {groups.map((g) => (
                <option key={g.name} value={g.name}>{g.emoji} {g.name}</option>
              ))}
              <option value="__custom__">✏️ 新建分类…</option>
            </select>
            <button type="button" onClick={addItem} className="shrink-0 rounded-lg bg-[#FF7A45] px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-[#e6662e]">+</button>
          </div>
        </div>
        {newGroup === "__custom__" && (
          <input
            value={customGroupName}
            onChange={(e) => setCustomGroupName(e.target.value)}
            placeholder="输入新分类名…"
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#FF7A45] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        )}
      </div>
    </div>
  );
}
