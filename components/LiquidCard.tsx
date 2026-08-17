"use client";

import { useRef, useState, type ReactNode, type CSSProperties } from "react";

/**
 * LiquidCard — Apple-style liquid glass surface (WWDC 2025 vibe).
 * Frosted blur + saturation boost + mouse-following sheen + top edge highlight.
 * Works over any background; the effect is most visible over photos.
 *
 * Pass className for padding/sizing; `solid` boosts the white base for
 * text-heavy panels where clarity matters more than transparency.
 */
export default function LiquidCard({
  children,
  className = "",
  style,
  blur = 18,
  radius = 20,
  solid = false,
  glow = true,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  blur?: number;
  radius?: number;
  /** true = more opaque white base (content-first, still glassy) */
  solid?: boolean;
  /** enable mouse-following sheen */
  glow?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [sheen, setSheen] = useState({ x: 50, y: 50, on: false });

  return (
    <div
      ref={ref}
      onMouseMove={
        glow
          ? (e) => {
              const r = ref.current!.getBoundingClientRect();
              setSheen({
                x: ((e.clientX - r.left) / r.width) * 100,
                y: ((e.clientY - r.top) / r.height) * 100,
                on: true,
              });
            }
          : undefined
      }
      onMouseLeave={glow ? () => setSheen((s) => ({ ...s, on: false })) : undefined}
      className={"relative overflow-hidden " + className}
      style={{
        borderRadius: radius,
        backdropFilter: `blur(${blur}px) saturate(1.6)`,
        WebkitBackdropFilter: `blur(${blur}px) saturate(1.6)`,
        // `solid` is for text-heavy cards on light pages: opaque white so the
        // translucent glass never renders as a gray panel over a white bg.
        background: solid ? "#ffffff" : "rgba(255,255,255,0.14)",
        border: solid
          ? "1px solid rgba(226,232,240,0.9)"
          : "1px solid rgba(255,255,255,0.35)",
        boxShadow:
          "0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.45)",
        ...style,
      }}
    >
      {glow && (
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-300"
          style={{
            opacity: sheen.on ? 1 : 0,
            background: `radial-gradient(240px circle at ${sheen.x}% ${sheen.y}%, rgba(255,255,255,0.3), transparent 65%)`,
          }}
        />
      )}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)" }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
