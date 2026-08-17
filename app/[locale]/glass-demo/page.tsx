"use client";

import { useRef, useState } from "react";

/** 液态玻璃卡片 —— Apple WWDC 2025 风格（借鉴 viraj-perera-dev/liquid-glass）
 *  纯 CSS 玻璃拟态 + 鼠标跟随高光。仅此演示页使用。 */
function LiquidCard({
  children,
  className = "",
  blur = 18,
  radius = 24,
}: {
  children: React.ReactNode;
  className?: string;
  blur?: number;
  radius?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [glow, setGlow] = useState({ x: 50, y: 50, on: false });

  return (
    <div
      ref={ref}
      onMouseMove={(e) => {
        const r = ref.current!.getBoundingClientRect();
        setGlow({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100, on: true });
      }}
      onMouseLeave={() => setGlow((g) => ({ ...g, on: false }))}
      className={"relative overflow-hidden " + className}
      style={{
        borderRadius: radius,
        backdropFilter: `blur(${blur}px) saturate(1.6)`,
        WebkitBackdropFilter: `blur(${blur}px) saturate(1.6)`,
        background: "rgba(255,255,255,0.12)",
        border: "1px solid rgba(255,255,255,0.25)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.35)",
        transition: "transform 0.3s ease",
      }}
    >
      {/* 鼠标跟随高光 */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: glow.on ? 1 : 0,
          background: `radial-gradient(240px circle at ${glow.x}% ${glow.y}%, rgba(255,255,255,0.28), transparent 65%)`,
        }}
      />
      {/* 顶部内高光（玻璃边） */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)" }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export default function GlassDemoPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* 富国岛照片背景（玻璃折射效果在照片上才明显） */}
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center"
        style={{ backgroundImage: "url(/images/phuquoc-paradise.jpg)" }}
      />
      <div className="fixed inset-0 -z-10 bg-black/25" />

      <div className="mx-auto max-w-5xl px-6 py-24">
        <h1 className="font-headline text-4xl font-black uppercase tracking-tight text-white drop-shadow-lg sm:text-5xl">
          Liquid Glass 演示
        </h1>
        <p className="mt-3 max-w-xl text-white/85">
          Apple WWDC 2025 风格的液态玻璃卡片。鼠标移到卡片上看看跟随的高光效果。
          此页面仅作效果演示，不影响网站其他部分。
        </p>

        <div className="mt-14 grid gap-8 sm:grid-cols-2">
          {/* 卡片 1：标准玻璃卡 */}
          <LiquidCard className="p-8">
            <h2 className="text-2xl font-bold text-white">🌊 标准玻璃卡</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/85">
              blur 18px · 圆角 24px · 半透明白底 + 白色描边 + 内高光。
              背后的海滩照片被玻璃柔化折射。
            </p>
            <button className="mt-6 rounded-full bg-white/90 px-6 py-2.5 text-sm font-bold text-slate-900 transition hover:bg-white">
              按钮
            </button>
          </LiquidCard>

          {/* 卡片 2：重模糊 */}
          <LiquidCard className="p-8" blur={28} radius={32}>
            <h2 className="text-2xl font-bold text-white">🫧 重磨砂</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/85">
              blur 28px + saturate 1.6 —— 颜色更浓、更&quot;果冻&quot;。
              适合内容密度高的面板。
            </p>
            <div className="mt-6 flex gap-2">
              {["🌊", "🏖️", "🚕", "🏨", "🍽️"].map((e) => (
                <span key={e} className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-lg backdrop-blur-sm">
                  {e}
                </span>
              ))}
            </div>
          </LiquidCard>

          {/* 卡片 3：玻璃时间卡（模拟行程场景） */}
          <LiquidCard className="p-8" blur={14} radius={20}>
            <div className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/70">DAY 1 · 富国岛</div>
            <h2 className="mt-2 text-2xl font-bold text-white">📋 行程卡片示例</h2>
            <ul className="mt-4 space-y-2 text-sm text-white/90">
              <li className="flex items-center gap-2">09:00 🏖️ 星星沙滩 <span className="text-white/60">3h</span></li>
              <li className="flex items-center gap-2">14:00 🚡 香岛缆车 <span className="text-white/60">4h</span></li>
              <li className="flex items-center gap-2">19:00 🦞 阳东夜市 <span className="text-white/60">2h</span></li>
            </ul>
          </LiquidCard>

          {/* 卡片 4：小圆角锐利风 */}
          <LiquidCard className="p-8" blur={20} radius={8}>
            <h2 className="text-2xl font-bold text-white">⬛ 锐利边角</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/85">
              圆角 8px —— 更硬朗的风格。可自由组合 blur / 圆角 / 透明度参数。
            </p>
          </LiquidCard>
        </div>

        <p className="mt-14 text-center text-xs text-white/60">
          想用到网站上（比如行程页/我的页的卡片升级成液态玻璃）→ 告诉 Claude。
          不想要就删掉 app/[locale]/glass-demo/ 这个目录。
        </p>
      </div>
    </div>
  );
}
