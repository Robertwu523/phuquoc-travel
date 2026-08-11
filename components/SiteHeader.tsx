"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import LanguageSwitcher from "./LanguageSwitcher";

const TABS = [
  { key: "trip", href: "/trip", label: "我的行程", emoji: "📋" },
  { key: "me", href: "/me", label: "我的", emoji: "👤" },
] as const;

// tool links: icon-only buttons (kept subtle, not competing with main tabs)
const TOOLS = [
  { href: "/map", label: "地图", emoji: "🗺️" },
  { href: "/flights", label: "机票", emoji: "✈️" },
  { href: "/info", label: "信息", emoji: "📘" },
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

  const transparent = isHome && !scrolled;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header
      className={
        "fixed inset-x-0 top-0 z-[1000] h-16 transition-colors duration-300 " +
        (transparent
          ? "bg-transparent"
          : "border-b border-slate-200/70 bg-white/85 backdrop-blur-md dark:border-slate-800/70 dark:bg-slate-950/85")
      }
    >
      <div className="mx-auto flex h-full max-w-7xl items-center gap-3 px-4">
        {/* brand */}
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

        <div className="flex flex-1 items-center justify-center gap-2">
          {/* main tabs: prominent pill buttons */}
          <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white/70 p-1 backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
            {TABS.map((tab) => {
              const active = isActive(tab.href);
              return (
                <Link
                  key={tab.key}
                  href={tab.href}
                  className={
                    "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition " +
                    (transparent
                      ? active
                        ? "bg-[#FF7A45] text-white shadow-sm"
                        : "text-white/85 hover:bg-white/15"
                      : active
                      ? "bg-[#FF7A45] text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800")
                  }
                >
                  <span className="text-base">{tab.emoji}</span>
                  {tab.label}
                </Link>
              );
            })}
          </div>

          {/* divider */}
          <div className="hidden h-5 w-px bg-slate-300/50 sm:block dark:bg-slate-700/60" />

          {/* tool icons: subtle, grouped */}
          <div className="hidden items-center gap-0.5 sm:flex">
            {TOOLS.map((tool) => {
              const active = isActive(tool.href);
              return (
                <Link
                  key={tool.href}
                  href={tool.href}
                  title={tool.label}
                  className={
                    "flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium transition " +
                    (transparent
                      ? active
                        ? "bg-white/20 text-white"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                      : active
                      ? "bg-[#FF7A45]/15 text-[#FF7A45]"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800")
                  }
                >
                  <span className="text-sm">{tool.emoji}</span>
                  <span className="hidden lg:inline">{tool.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="ml-auto shrink-0">
          <LanguageSwitcher />
        </div>
      </div>

      {/* mobile: main tabs + tools scrollable */}
      <div
        className={
          "flex items-center gap-2 overflow-x-auto px-4 pb-1.5 md:hidden " +
          (transparent ? "text-white/85" : "text-slate-600 dark:text-slate-300")
        }
      >
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={tab.href}
            className={
              "whitespace-nowrap text-xs font-semibold " +
              (isActive(tab.href) ? "text-[#FF7A45]" : "")
            }
          >
            {tab.emoji} {tab.label}
          </Link>
        ))}
        <span className="text-slate-300 dark:text-slate-600">·</span>
        {TOOLS.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="whitespace-nowrap text-[11px] font-medium"
          >
            {tool.emoji} {tool.label}
          </Link>
        ))}
      </div>
    </header>
  );
}
