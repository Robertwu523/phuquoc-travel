"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import LanguageSwitcher from "./LanguageSwitcher";

const NAV = [
  { key: "map", href: "/map" },
  { key: "flights", href: "/flights" },
  { key: "trip", href: "/trip" },
  { key: "info", href: "/info" },
] as const;

export default function SiteHeader() {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Transparent overlay over the home hero; solid frosted elsewhere / on scroll.
  const transparent = isHome && !scrolled;
  const linkBase =
    "whitespace-nowrap text-[11px] font-medium uppercase tracking-[0.16em] transition md:text-xs ";
  const linkColor = transparent
    ? "text-white/85 hover:text-white"
    : "text-slate-600 hover:text-teal-700 dark:text-slate-300";

  return (
    <header
      className={
        "fixed inset-x-0 top-0 z-[1000] h-16 transition-colors duration-300 " +
        (transparent
          ? "bg-transparent"
          : "border-b border-slate-200/70 bg-white/85 backdrop-blur-md dark:border-slate-800/70 dark:bg-slate-950/85")
      }
    >
      <div className="mx-auto flex h-full max-w-7xl items-center gap-4 px-4">
        <Link
          href="/"
          className={
            "shrink-0 text-base font-bold tracking-tight " +
            (transparent ? "text-white" : "text-slate-900 dark:text-white")
          }
        >
          富国岛
          <span className="ml-1 align-middle text-[10px] font-semibold uppercase tracking-[0.2em] opacity-60">
            Phú Quốc
          </span>
        </Link>

        <nav className="flex flex-1 items-center gap-5 overflow-x-auto md:justify-center md:gap-7">
          {NAV.map((it) => {
            const active = pathname.startsWith(it.href);
            return (
              <Link
                key={it.key}
                href={it.href}
                className={
                  linkBase +
                  (transparent
                    ? active
                      ? "text-white"
                      : "text-white/80 hover:text-white"
                    : active
                    ? "text-teal-700 dark:text-teal-400"
                    : linkColor)
                }
              >
                {t(it.key)}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto shrink-0">
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
