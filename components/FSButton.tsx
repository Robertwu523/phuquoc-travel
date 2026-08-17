"use client";

import { useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";

/**
 * Feral Sky–style 3D flip button, with a `glass` variant that adds
 * Apple-style liquid glass (blur + saturate + mouse-following sheen).
 * Renders a <button> by default; pass `href` to render an <a> instead.
 */
export default function FSButton({
  children,
  variant = "solid",
  className = "",
  href,
  ...props
}: {
  children: ReactNode;
  variant?: "solid" | "outline" | "glass";
  href?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const ref = useRef<HTMLElement | null>(null);
  const [sheen, setSheen] = useState({ x: 50, on: false });

  const base =
    "group relative inline-flex select-none items-center justify-center overflow-hidden font-headline font-black uppercase tracking-tighter leading-none transition-[background-color] duration-200";
  const sizing = "px-6 py-3 text-base";

  const glassStyle =
    variant === "glass"
      ? {
          borderRadius: 999,
          backdropFilter: "blur(16px) saturate(1.8)",
          WebkitBackdropFilter: "blur(16px) saturate(1.8)",
          background: "rgba(255,255,255,0.18)",
          border: "1px solid rgba(255,255,255,0.4)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.5)",
          color: "#fff",
        }
      : undefined;

  const skin =
    variant === "glass"
      ? ""
      : variant === "solid"
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
  const style = {
    perspective: "108px",
    ...(variant !== "glass" ? { borderRadius: 0 } : {}),
    ...glassStyle,
    ...props.style,
  };

  const track = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setSheen({ x: ((e.clientX - r.left) / r.width) * 100, on: true });
  };

  const sheenLayer =
    variant === "glass" ? (
      <>
        <span
          className="pointer-events-none absolute inset-0 transition-opacity duration-300"
          style={{
            opacity: sheen.on ? 1 : 0,
            background: `radial-gradient(140px circle at ${sheen.x}% 50%, rgba(255,255,255,0.45), transparent 70%)`,
          }}
        />
        <span
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)" }}
        />
      </>
    ) : null;

  if (href) {
    return (
      <a
        ref={ref as React.RefObject<HTMLAnchorElement>}
        href={href}
        className={cls}
        style={style}
        onMouseMove={track}
        onMouseLeave={() => setSheen((s) => ({ ...s, on: false }))}
      >
        {sheenLayer}
        <span className="relative z-10">{inner}</span>
      </a>
    );
  }
  return (
    <button
      type="button"
      ref={ref as React.RefObject<HTMLButtonElement>}
      {...props}
      className={cls}
      style={style}
      onMouseMove={track}
      onMouseLeave={() => setSheen((s) => ({ ...s, on: false }))}
    >
      {sheenLayer}
      <span className="relative z-10">{inner}</span>
    </button>
  );
}
