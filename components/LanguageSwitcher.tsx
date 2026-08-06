"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const LABELS: Record<string, string> = { zh: "中文", en: "English" };

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  function onChange(value: string) {
    router.replace(pathname, { locale: value });
  }

  return (
    <div className="flex items-center gap-1 rounded-full bg-white/70 p-1 ring-1 ring-black/5 backdrop-blur dark:bg-white/10">
      {routing.locales.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => onChange(l)}
          className={
            "rounded-full px-3 py-1 text-sm font-medium transition " +
            (l === locale
              ? "bg-teal-600 text-white shadow"
              : "text-slate-600 hover:text-teal-700 dark:text-slate-300")
          }
          aria-pressed={l === locale}
        >
          {LABELS[l]}
        </button>
      ))}
    </div>
  );
}
