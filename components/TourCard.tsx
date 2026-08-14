"use client";

import { motion } from "framer-motion";
import type { POI } from "@/data/pois";
import { categoryStyles } from "@/lib/categories";
import type { Locale } from "@/lib/stops";

/** Map a POI category to one of the existing Phú Quốc photos (fallback). */
const PHOTO_FOR: Record<string, string> = {
  beach: "/images/phuquoc-sea.jpg",
  family: "/images/phuquoc-vinwonders.jpg",
  nature: "/images/phuquoc-cablecar.jpg",
  island: "/images/phuquoc-boats.jpg",
  market: "/images/phuquoc-town.jpg",
  temple: "/images/phuquoc-town.jpg",
  culture: "/images/phuquoc-sunset.jpg",
};

/**
 * Feral Sky–style expedition card.
 * Photo + title (highlight-swipe on hover) + location (mono) + intro.
 */
export default function TourCard({
  poi,
  locale,
  intro,
}: {
  poi: POI;
  locale: Locale;
  intro?: string;
}) {
  const style = categoryStyles[poi.category];
  const title = poi.name[locale];
  const desc = intro ?? poi.description[locale];
  const photo = poi.image ?? PHOTO_FOR[poi.category] ?? "/images/phuquoc-sunset.jpg";

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group flex h-full flex-col rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="flex flex-1 flex-col gap-4 p-5">
        {/* photo */}
        <div className="relative aspect-[4.2/3.5] w-full overflow-hidden rounded-lg">
          <div
            className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
            style={{ backgroundImage: `url(${photo})` }}
          />
        </div>

        {/* title block */}
        <div className="font-headline">
          <h3 className="relative text-2xl font-black uppercase leading-none tracking-tighter text-slate-900 md:text-3xl">
            <span className="relative inline-block">
              <span className="relative z-10 px-1">{title}</span>
              <span className="absolute inset-y-0 left-0 -right-[1px] -z-10 origin-left scale-x-0 bg-[#00a7fa] transition-transform duration-300 group-hover:scale-x-100" />
            </span>
          </h3>
          <span className="font-mono-ui mt-2 block text-xs tracking-widest text-slate-400">
            {style.emoji} {poi.category.toUpperCase()}
          </span>
        </div>

        {/* intro */}
        <p className="max-w-xl text-sm leading-relaxed text-slate-500">{desc}</p>
      </div>
    </motion.div>
  );
}
