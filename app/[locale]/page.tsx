import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function Page() {
  const t = await getTranslations("Hero");

  return (
    <section className="relative -mt-16 flex min-h-screen flex-col items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center"
        style={{ backgroundImage: "url(/images/phuquoc-sunset.jpg)" }}
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/60 via-black/30 to-black/70" />

      <span className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-white backdrop-blur-md">
        🇻🇳 Phú Quốc · 从香港出发
      </span>
      <h1 className="mt-5 px-4 text-center text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl md:text-7xl">
        {t("title")}
      </h1>
      <p className="mt-5 max-w-xl px-4 text-center text-sm text-white/85 sm:text-base">
        {t("subtitle")}
      </p>
      <Link
        href="/trip"
        className="group mt-9 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 text-base font-bold text-slate-900 shadow-lg transition hover:bg-slate-100"
      >
        进入行程
        <span className="transition-transform group-hover:translate-x-0.5">→</span>
      </Link>
    </section>
  );
}
