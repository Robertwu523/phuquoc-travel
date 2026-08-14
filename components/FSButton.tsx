"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * Feral Sky–style 3D flip button. Renders a <button> by default; pass `href`
 * to render an <a> instead (so it can act as a link).
 */
export default function FSButton({
  children,
  variant = "solid",
  className = "",
  href,
  ...props
}: {
  children: ReactNode;
  variant?: "solid" | "outline";
  href?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const base =
    "group relative inline-flex select-none items-center justify-center overflow-hidden font-headline font-black uppercase tracking-tighter leading-none transition-[background-color] duration-200";
  const sizing = "px-6 py-3 text-base";
  const skin =
    variant === "solid"
      ? "bg-white text-slate-900 border border-slate-200 hover:bg-[#00a7fa] hover:text-white hover:border-[#00a7fa]"
      : "bg-transparent text-slate-700 border border-slate-300 hover:bg-[#00a7fa] hover:text-white hover:border-[#00a7fa]";

  const inner = (
    <span className="relative block overflow-hidden" style={{ transformStyle: "preserve-3d" }}>
      <span className="block transition-transform duration-500 [transition-timing-function:cubic-bezier(0.645,0.045,0.355,1)] group-hover:[transform:rotateX(90deg)]">
        {children}
      </span>
      <span
        aria-hidden
        className="absolute inset-0 block transition-transform duration-500 [transition-timing-function:cubic-bezier(0.645,0.045,0.355,1)] [transform:rotateX(-90deg)] group-hover:[transform:rotateX(0deg)]"
      >
        {children}
      </span>
    </span>
  );

  const cls = `${base} ${sizing} ${skin} ${className}`;
  const style = { perspective: "108px", borderRadius: 0, ...props.style };

  if (href) {
    return (
      <a href={href} className={cls} style={style}>
        {inner}
      </a>
    );
  }
  return (
    <button type="button" {...props} className={cls} style={style}>
      {inner}
    </button>
  );
}
