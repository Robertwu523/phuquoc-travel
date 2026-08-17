import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Reveal from "@/components/Reveal";
import LiquidCard from "@/components/LiquidCard";

type Block = {
  titleKey:
    | "visaTitle"
    | "seasonTitle"
    | "transportTitle"
    | "currencyTitle"
    | "timezoneTitle"
    | "toolsTitle";
  bodyKey:
    | "visaBody"
    | "seasonBody"
    | "transportBody"
    | "currencyBody"
    | "timezoneBody"
    | "toolsBody";
  emoji: string;
  href?: string; // when set, the card links to this sub-page
};

const blocks: Block[] = [
  { titleKey: "visaTitle", bodyKey: "visaBody", emoji: "🛂", href: "/info/documents" },
  { titleKey: "seasonTitle", bodyKey: "seasonBody", emoji: "🌤️", href: "/info/weather" },
  { titleKey: "transportTitle", bodyKey: "transportBody", emoji: "🛵" },
  { titleKey: "currencyTitle", bodyKey: "currencyBody", emoji: "💸", href: "/info/currency" },
  { titleKey: "toolsTitle", bodyKey: "toolsBody", emoji: "🧭", href: "/info/resources" },
  { titleKey: "timezoneTitle", bodyKey: "timezoneBody", emoji: "🕐" },
];

export default async function InfoSection() {
  const t = await getTranslations("Info");

  return (
    <section id="info" className="scroll-mt-20 py-12">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {blocks.map((b, i) => {
            const inner = (
              <>
                <h3 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
                  <span className="text-xl">{b.emoji}</span>
                  {t(b.titleKey)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {t(b.bodyKey)}
                </p>
                {b.href && (
                  <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-teal-700 dark:text-teal-400">
                    {t("enterDetail")} <span>→</span>
                  </div>
                )}
              </>
            );
            const card = b.href ? (
              <Link key={b.titleKey} href={b.href} className="group block h-full">
                <LiquidCard solid className="h-full p-5 transition hover:-translate-y-0.5">
                  {inner}
                </LiquidCard>
              </Link>
            ) : (
              <LiquidCard key={b.titleKey} solid className="h-full p-5">
                {inner}
              </LiquidCard>
            );
            return (
              <Reveal key={b.titleKey} delay={i * 80} className="h-full">
                {card}
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
