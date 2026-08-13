"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Link } from "@/i18n/navigation";

export default function UserMenu() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (!user) {
    return (
      <Link
        href="/auth"
        className="shrink-0 rounded-full bg-[#FF7A45] px-3 py-1 text-xs font-bold text-white transition hover:bg-[#e6662e]"
      >
        登录
      </Link>
    );
  }

  const initial = (user.email ?? "?").charAt(0).toUpperCase();

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white transition hover:bg-teal-700"
        aria-label="account menu"
      >
        {initial}
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-[2000] w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <div className="truncate rounded-md px-2 py-1.5 text-xs text-slate-400">
            {user.email}
          </div>
          <Link
            href="/me"
            onClick={() => setOpen(false)}
            className="block rounded-md px-2 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            ⚙️ 我的
          </Link>
          <button
            type="button"
            onClick={() => { setOpen(false); signOut(); }}
            className="block w-full rounded-md px-2 py-1.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            退出登录
          </button>
        </div>
      )}
    </div>
  );
}
