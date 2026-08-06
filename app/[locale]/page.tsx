import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function Page() {
  const t = await getTranslations("Hero");
  const h = await getTranslations("Home");

  return (
    <>
      {/* ============ HERO: full-screen photo + overlay text ============ */}
      <section
        className="relative -mt-16 h-screen min-h-[560px] w-full bg-cover bg-center"
        style={{ backgroundImage: "url(/images/phuquoc-sunset.jpg)" }}
      >
        {/* readability gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/25 to-black/70" />

        <div className="relative z-10 mx-auto flex h-full max-w-5xl flex-col items-center justify-center px-4 text-center">
          <span className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-white backdrop-blur-md">
            🇻🇳 Phú Quốc · 从香港出发
          </span>

          <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl md:text-7xl">
            {t("title")}
          </h1>

          <p className="mt-5 max-w-xl text-sm text-white/85 sm:text-base">
            {t("subtitle")}
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/map"
              className="group inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-semibold text-slate-900 shadow-lg transition hover:bg-slate-100"
            >
              {t("startPlanning")}
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
            <Link
              href="/flights"
              className="inline-flex items-center rounded-full border border-white/40 px-7 py-3 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/10"
            >
              {t("viewFlights")}
            </Link>
          </div>
        </div>

        {/* bottom hint */}
        <div className="absolute inset-x-0 bottom-6 z-10 mx-auto flex max-w-5xl items-center justify-between px-6 text-[11px] uppercase tracking-[0.16em] text-white/70">
          <span>· 富国岛 · 越南</span>
          <span>下滑探索 ↓</span>
        </div>
      </section>

      {/* ============ CONTENT: asymmetric title + bento grid ============ */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        {/* title block */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700 dark:text-teal-400">
              {h("featuresTitle")}
            </span>
            <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl dark:text-white">
              探索 · 规划 · 出发
              <br />
              <span className="text-slate-400">一站式富国岛</span>
            </h2>
          </div>
          <div className="md:col-span-5">
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {h("mapDesc")}
            </p>
            <div className="mt-4 flex gap-3">
              <Link
                href="/map"
                className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900"
              >
                {h("enter")} →
              </Link>
              <Link
                href="/info"
                className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900 dark:border-slate-700 dark:text-slate-200"
              >
                {h("infoTitle")}
              </Link>
            </div>
          </div>
        </div>

        {/* bento grid */}
        <div className="mt-12 grid auto-rows-[210px] grid-cols-2 gap-4 sm:auto-rows-[230px] lg:grid-cols-4">
          {/* big card: map */}
          <BentoCard
            href="/map"
            tag="MOST POPULAR"
            title={h("mapTitle")}
            image="/images/phuquoc-sunset.jpg"
            className="col-span-2 row-span-2"
            featured
          />
          {/* wide card: flights */}
          <BentoCard
            href="/flights"
            tag="FLIGHTS"
            title={h("flightsTitle")}
            image="/images/phuquoc-boats.jpg"
            className="col-span-2"
          />
          {/* small card: trip */}
          <BentoCard
            href="/trip"
            tag="ITINERARY"
            title={h("tripTitle")}
            image="/images/phuquoc-sea.jpg"
          />
          {/* small card: info */}
          <BentoCard
            href="/info"
            tag="GUIDE"
            title={h("infoTitle")}
            image="/images/phuquoc-vinwonders.jpg"
          />
        </div>
      </section>
    </>
  );
}

function BentoCard({
  href,
  tag,
  title,
  image,
  className = "",
  featured = false,
}: {
  href: string;
  tag: string;
  title: string;
  image: string;
  className?: string;
  featured?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        "group relative overflow-hidden rounded-2xl bg-slate-200 transition duration-300 hover:-translate-y-1 hover:shadow-2xl dark:bg-slate-800 " +
        className
      }
    >
      <img
        src={image}
        alt=""
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      {/* dark gradient for text contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/5" />

      {/* top-right tag */}
      <span
        className={
          "absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] backdrop-blur-md " +
          (featured
            ? "bg-white/90 text-slate-900"
            : "bg-black/35 text-white/90")
        }
      >
        {tag}
      </span>

      {/* bottom text */}
      <div className="absolute inset-x-0 bottom-0 p-4">
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">
          Phú Quốc
        </div>
        <div
          className={
            "mt-0.5 font-bold text-white " +
            (featured ? "text-2xl" : "text-base")
          }
        >
          {title}
        </div>
      </div>
    </Link>
  );
}
