import { getTranslations, getLocale } from "next-intl/server";
import { pois } from "@/data/pois";
import TourCard from "@/components/TourCard";
import Marquee from "@/components/Marquee";
import SectionText from "@/components/SectionText";
import FSButton from "@/components/FSButton";
import type { Locale } from "@/lib/stops";

export default async function Page() {
  const t = await getTranslations("Hero");
  const locale = (await getLocale()) as Locale;

  return (
    <>
      {/* ===== Hero: full-bleed sunset photo + dark overlay + centered text ===== */}
      <section className="-mt-16 relative flex min-h-screen w-full items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 -z-10 bg-cover bg-center"
          style={{ backgroundImage: "url(/images/phuquoc-palm-frame.jpg)" }}
        />
        {/* dark overlay so white text reads clearly */}
        <div className="absolute inset-0 -z-10 bg-black/55" />

        <div className="flex flex-col items-center px-6 text-center">
          <h1 className="font-headline text-5xl font-black uppercase leading-[0.95] tracking-tight text-white drop-shadow-lg sm:text-6xl md:text-7xl">
            {t("title")}
          </h1>
          <p className="mt-3 text-sm font-medium uppercase tracking-[0.25em] text-white/80 sm:text-base">
            Phú Quốc · 富国岛
          </p>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/90 sm:text-lg">
            {t("subtitle")}
          </p>
          <div className="mt-10">
            <FSButton href="/trip">{t("startPlanning")}</FSButton>
          </div>
        </div>
      </section>

      {/* ===== Marquee ===== */}
      <Marquee items={pois.map((p) => p.name[locale])} />

      {/* ===== Expedition gallery ===== */}
      <section id="expeditions" className="mx-auto max-w-7xl px-6 py-20">
        <SectionText index="[01]" eyebrow="EXPEDITIONS" title="精选景点" />
        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {pois.slice(0, 9).map((poi) => (
            <TourCard key={poi.id} poi={poi} locale={locale} />
          ))}
        </div>
        <div className="mt-12 text-center">
          <FSButton variant="outline" href="/map">在地图上探索 →</FSButton>
        </div>
      </section>
    </>
  );
}
