import type { ReactNode } from "react";

/** Feral Sky–style section heading: mono index eyebrow + sharp headline. */
export default function SectionText({
  index,
  eyebrow,
  title,
  align = "left",
}: {
  index: string;
  eyebrow: string;
  title: ReactNode;
  align?: "left" | "center";
}) {
  return (
    <div className={align === "center" ? "text-center" : "text-left"}>
      <div className="font-mono-ui text-[11px] uppercase tracking-[0.2em] text-slate-400">
        <span className="text-[#00a7fa]">{index}</span> / {eyebrow}
      </div>
      <h2 className="mt-2 font-headline text-3xl font-bold uppercase tracking-tight text-slate-900 sm:text-4xl md:text-[2.5rem]">
        {title}
      </h2>
    </div>
  );
}
