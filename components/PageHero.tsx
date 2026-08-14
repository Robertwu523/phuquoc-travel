import type { ReactNode } from "react";
import Reveal from "@/components/Reveal";

/** Immersive photo banner used at the top of each sub-page. Pure photo, no gradient —
 *  text legibility comes from drop-shadow instead of an overlay. */
export default function PageHero({
  image,
  eyebrow,
  title,
  subtitle,
  children,
}: {
  image: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <section
      className="relative h-[240px] w-full bg-cover bg-center sm:h-[320px]"
      style={{ backgroundImage: `url(${image})` }}
    >
      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-7">
        <Reveal as="span" delay={0}>
          <span className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/90 backdrop-blur-md drop-shadow">
            {eyebrow}
          </span>
        </Reveal>
        <Reveal as="h1" delay={120} className="mt-1.5 text-3xl font-extrabold leading-tight tracking-tight text-white drop-shadow-lg sm:text-5xl">
          {title}
        </Reveal>
        {subtitle && (
          <Reveal as="p" delay={240} className="mt-2 max-w-2xl text-sm text-white drop-shadow-md">
            {subtitle}
          </Reveal>
        )}
        {children && <div className="mt-3">{children}</div>}
      </div>
    </section>
  );
}
