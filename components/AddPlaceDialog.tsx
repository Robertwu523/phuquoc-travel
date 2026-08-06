"use client";

import { useLocale, useTranslations } from "next-intl";
import type { PoiCategory } from "@/data/pois";
import { categoryStyles } from "@/lib/categories";
import { buildReviewLinks } from "@/lib/reviews";

export type Pending = {
  lat: number;
  lng: number;
  loading: boolean;
  name: string;
  info: string;
  category: PoiCategory;
  duration: number;
  snappedId: string | null;
  error?: string;
};

const CATEGORY_ORDER: PoiCategory[] = [
  "beach",
  "family",
  "nature",
  "island",
  "market",
  "temple",
  "culture",
];

export default function AddPlaceDialog({
  pending,
  onChange,
  onConfirm,
  onCancel,
}: {
  pending: Pending;
  onChange: (patch: Partial<Pending>) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations("Map");
  const tc = useTranslations("Categories");
  const locale = useLocale() as "zh" | "en";

  const links = buildReviewLinks(pending.name || "Phu Quoc", locale);

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {t("addPlaceTitle")}
          </h3>
          <span
            className={
              "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase " +
              (pending.snappedId
                ? "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300"
                : "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300")
            }
          >
            {pending.snappedId ? "📌 " + t("snappedBadge") : "📍 " + t("customBadge")}
          </span>
        </div>

        {pending.loading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-slate-500">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
            {t("recognizing")}
          </div>
        ) : (
          <>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
              {t("nameLabel")}
            </label>
            <input
              value={pending.name}
              onChange={(e) => onChange({ name: e.target.value })}
              className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm font-semibold text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />

            <div className="mt-2 rounded-md bg-slate-50 p-2.5 text-xs leading-relaxed text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
              {pending.info || t("noInfo")}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <label className="flex flex-col text-xs font-medium text-slate-600 dark:text-slate-300">
                {t("categoryLabel")}
                <select
                  value={pending.category}
                  onChange={(e) => onChange({ category: e.target.value as PoiCategory })}
                  className="mt-1 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  {CATEGORY_ORDER.map((c) => (
                    <option key={c} value={c}>
                      {categoryStyles[c].emoji} {tc(c)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col text-xs font-medium text-slate-600 dark:text-slate-300">
                {t("durationLabel")}
                <input
                  type="number"
                  min={0.5}
                  step={0.5}
                  value={pending.duration}
                  onChange={(e) => onChange({ duration: Number(e.target.value) })}
                  className="mt-1 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </label>
            </div>

            <div className="mt-3">
              <div className="mb-1 text-xs font-medium text-slate-500">{t("reviewsLabel")}</div>
              <div className="flex flex-wrap gap-1.5">
                {links.map((l) => (
                  <a
                    key={l.key}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-teal-100 hover:text-teal-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    {l.label}
                  </a>
                ))}
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {t("addPlaceCancel")}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={!pending.name.trim()}
                className="rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-40"
              >
                {t("addPlaceConfirm")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
