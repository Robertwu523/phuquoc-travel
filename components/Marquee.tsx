/** Horizontal auto-scrolling band of names separated by accent dots. */
export default function Marquee({ items }: { items: string[] }) {
  const row = [...items, ...items]; // duplicate for seamless loop
  return (
    <div className="flex overflow-hidden border-y border-slate-200 bg-white py-4">
      <div className="marquee-track">
        {row.map((it, i) => (
          <span key={i} className="flex items-center">
            <span className="px-6 font-headline text-lg font-medium uppercase tracking-wider text-slate-900">
              {it}
            </span>
            <span className="text-[#00a7fa]">●</span>
          </span>
        ))}
      </div>
    </div>
  );
}
