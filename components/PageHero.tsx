import type { ReactNode } from "react";

/** Immersive photo banner used at the top of each sub-page (matches the hero style). */
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
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/30 to-black/75" />
      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-7">
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/80">
          {eyebrow}
        </span>
        <h1 className="mt-1.5 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 max-w-2xl text-sm text-white/80">{subtitle}</p>
        )}
        {children && <div className="mt-3">{children}</div>}
      </div>
    </section>
  );
}
