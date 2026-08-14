"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

/**
 * Reveal — fade-in + rise when scrolled into view (the "Landed" feel).
 *
 * Safety: starts visible. Hides only after mount *and* only when an observer
 * is actually watching, so SSR / no-JS / failed observers never strand content
 * off-screen. Respects prefers-reduced-motion (renders plain, no transform).
 */
export default function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  as?: ElementType;
  className?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);
  // Start shown. Flip to hidden only on the client once we know we can observe.
  const [shown, setShown] = useState(true);
  const [canHide, setCanHide] = useState(false);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return; // stay shown, no animation

    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    // We can safely hide now — an observer will reveal us.
    setCanHide(true);
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect(); // reveal once
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const hidden = canHide && !shown;
  const Component = Tag as ElementType;

  return (
    <Component
      ref={ref}
      className={
        className +
        (canHide
          ? " transition-all duration-700 ease-out will-change-[opacity,transform]" +
            (hidden ? " opacity-0 translate-y-4" : " opacity-100 translate-y-0")
          : "")
      }
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Component>
  );
}
