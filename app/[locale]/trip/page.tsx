"use client";

import { useTranslations } from "next-intl";
import { useTripStore } from "@/lib/store";
import TripBuilder from "@/components/TripBuilder";
import PageHero from "@/components/PageHero";

export default function Page() {
  const tp = useTranslations("Planner");
  const h = useTranslations("Home");
  const hydrated = useTripStore((s) => s._hasHydrated);

  return (
    <>
      <PageHero
        image="/images/phuquoc-sea.jpg"
        eyebrow="ITINERARY"
        title={tp("title")}
        subtitle={h("tripDesc")}
      />
      <section className="mx-auto max-w-5xl px-4 py-10">
        {!hydrated ? (
          <div className="h-40 animate-pulse rounded-xl bg-slate-200/70 dark:bg-slate-800/60" />
        ) : (
          <TripBuilder />
        )}
      </section>
    </>
  );
}
