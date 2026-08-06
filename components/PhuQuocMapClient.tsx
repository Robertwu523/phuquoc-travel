"use client";

import dynamic from "next/dynamic";

// Leaflet touches `window` at import time; load the real map only on the client.
// Next.js 16 forbids `ssr:false` inside Server Components, so this wrapper is a
// Client Component that Server Components can import.
const PhuQuocMap = dynamic(() => import("./PhuQuocMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[420px] items-center justify-center rounded-2xl bg-slate-100 text-sm text-slate-400">
      Loading map…
    </div>
  ),
});

export default function PhuQuocMapClient() {
  return <PhuQuocMap />;
}
