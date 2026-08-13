"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import LanguageSwitcher from "./LanguageSwitcher";
import UserMenu from "./UserMenu";

const NAV_ITEMS = [
  { href: "/map", label: "地图", emoji: "🗺️" },
  { href: "/trip", label: "行程", emoji: "📋" },
  { href: "/flights", label: "机票", emoji: "✈️" },
  { href: "/info", label: "信息", emoji: "📘" },
  { href: "/me", label: "我的", emoji: "👤" },
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
        "fixed inset-x-0 top-0 z-[1000] h-auto transition-colors duration-300 md:h-16 " +
        (transparent
          ? "bg-transparent"
          : "border-b border-slate-200/70 bg-white/85 backdrop-blur-md dark:border-slate-800/70 dark:bg-slate-950/85")
      }
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
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
          {/* all nav items unified style */}
          <div className="hidden items-center gap-1 rounded-full border border-slate-200 bg-white/70 p-1 backdrop-blur md:flex dark:border-slate-700 dark:bg-slate-900/70">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
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
                  <span className="text-base">{item.emoji}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <LanguageSwitcher />
          <UserMenu />
        </div>
      </div>

      {/* mobile: all items scrollable */}
      <div
        className={
          "flex items-center gap-2 overflow-x-auto px-4 pb-1.5 md:hidden " +
          (transparent ? "text-white/85" : "text-slate-600 dark:text-slate-300")
        }
      >
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={
              "whitespace-nowrap text-xs font-semibold " +
              (isActive(item.href) ? "text-[#FF7A45]" : "")
            }
          >
            {item.emoji} {item.label}
          </Link>
        ))}
      </div>
    </header>
  );
}
