"use client";

import { useState, type ReactNode } from "react";
import PageHero from "@/components/PageHero";
import DocChecklist from "@/components/DocChecklist";
import {
  destinations,
  requiredDocs,
  recommendedDocs,
  overlooked,
  visaTypes,
  costs,
  evisaSteps,
  evisaLinks,
  officialSources,
  checklistGroups,
  pitfalls,
  type DocItem,
} from "@/data/documents";

function DocCard({ item }: { item: DocItem }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="font-semibold text-slate-900 dark:text-white">{item.name}</div>
      <div className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">{item.desc}</div>
      {item.tip && (
        <div className="mt-2 rounded-lg bg-teal-50 px-2.5 py-1.5 text-xs text-teal-800 dark:bg-teal-950/40 dark:text-teal-200">
          💡 {item.tip}
        </div>
      )}
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-4 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
      {children}
    </h2>
  );
}

export default function DocumentsPage() {
  const [code, setCode] = useState("VN");
  const dest = destinations.find((d) => d.code === code)!;

  return (
    <>
      <PageHero
        image="/images/phuquoc-town.jpg"
        eyebrow="DOCUMENTS"
        title="证件准备指南"
        subtitle="按「必办 → 建议办 → 容易忽略」三层理清，含费用、办理教程、检查清单。"
      />

      <div className="mx-auto max-w-5xl space-y-12 px-4 py-12">
        {/* ===== top checklist (most prominent) ===== */}
        <section className="rounded-2xl border-2 border-[#FF7A45] bg-gradient-to-b from-orange-50 to-white p-6 shadow-md dark:border-[#FF7A45] dark:from-orange-950/20 dark:to-slate-900">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✅</span>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">出发前检查清单</h2>
            <span className="ml-auto rounded-full bg-[#FF7A45] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
              最重要
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            按分类逐项打勾，进度自动保存（存本机）。全部完成即可放心出发。
          </p>
          <div className="mt-4">
            <DocChecklist groups={checklistGroups} />
          </div>
        </section>

        {/* destination selector */}
        <section>
          <SectionTitle>选择目的地</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {destinations.map((d) => (
              <button
                key={d.code}
                type="button"
                onClick={() => setCode(d.code)}
                className={
                  "rounded-full px-3 py-1.5 text-sm font-medium ring-1 transition " +
                  (d.code === code
                    ? "bg-slate-900 text-white ring-slate-900"
                    : "bg-white text-slate-600 ring-slate-200 hover:ring-slate-300 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700")
                }
              >
                {d.flag} {d.name}
              </button>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="text-lg font-bold text-slate-900 dark:text-white">
                {dest.flag} {dest.name}
              </div>
              <a
                href={dest.official}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-teal-700 hover:underline dark:text-teal-400"
              >
                官网核实最新政策 →
              </a>
            </div>
            <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs uppercase tracking-wider text-slate-400">签证要求</dt>
                <dd className="font-medium text-slate-800 dark:text-slate-200">{dest.visa}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-slate-400">停留</dt>
                <dd className="font-medium text-slate-800 dark:text-slate-200">{dest.stays}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-slate-400">费用</dt>
                <dd className="font-medium text-slate-800 dark:text-slate-200">{dest.fee}</dd>
              </div>
            </dl>
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
              ⚠️ {dest.note}
            </p>
            <p className="mt-2 text-[11px] text-slate-400">
              以香港特区护照为例，仅供参考；政策可能变动，出发前请到官网核实。
            </p>
          </div>
        </section>

        {/* required docs */}
        <section>
          <SectionTitle>① 必办证件 <span className="text-base font-normal text-slate-400">（没有就出不了国）</span></SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            {requiredDocs.map((d) => (
              <DocCard key={d.name} item={d} />
            ))}
          </div>
        </section>

        {/* recommended */}
        <section>
          <SectionTitle>② 建议办理 <span className="text-base font-normal text-slate-400">（有了更方便）</span></SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            {recommendedDocs.map((d) => (
              <DocCard key={d.name} item={d} />
            ))}
          </div>
        </section>

        {/* overlooked */}
        <section>
          <SectionTitle>③ 容易忽略但很重要</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            {overlooked.map((d) => (
              <DocCard key={d.name} item={d} />
            ))}
          </div>
        </section>

        {/* visa types */}
        <section>
          <SectionTitle>签证类型对比</SectionTitle>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-800/60">
                <tr>
                  <th className="px-4 py-3">类型</th>
                  <th className="px-4 py-3">难度</th>
                  <th className="px-4 py-3">典型国家</th>
                  <th className="px-4 py-3">关键点</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {visaTypes.map((v) => (
                  <tr key={v.type} className="align-top">
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{v.type}</td>
                    <td className="px-4 py-3 text-slate-500">{v.difficulty}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{v.examples}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{v.key}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* costs */}
        <section>
          <SectionTitle>费用参考</SectionTitle>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-800/60">
                <tr>
                  <th className="px-4 py-3">项目</th>
                  <th className="px-4 py-3">费用</th>
                  <th className="px-4 py-3">说明</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {costs.map((c) => (
                  <tr key={c.item}>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{c.item}</td>
                    <td className="px-4 py-3 text-teal-700 dark:text-teal-400">{c.cost}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{c.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* e-visa tutorial */}
        <section>
          <SectionTitle>越南 e-Visa 办理教程 <span className="text-base font-normal text-slate-400">（富国岛适用）</span></SectionTitle>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <ol className="space-y-2.5">
              {evisaSteps.map((s, i) => (
                <li key={i} className="flex gap-3 text-sm text-slate-700 dark:text-slate-200">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{s}</span>
                </li>
              ))}
            </ol>
            <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
              <a href={evisaLinks.official} target="_blank" rel="noopener noreferrer" className="rounded-full bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-700">
                e-Visa 官网申请 →
              </a>
              <a href={evisaLinks.bilibili} target="_blank" rel="noopener noreferrer" className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:border-teal-400 dark:border-slate-700 dark:text-slate-200">
                B站视频教程
              </a>
              <a href={evisaLinks.xiaohongshu} target="_blank" rel="noopener noreferrer" className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:border-teal-400 dark:border-slate-700 dark:text-slate-200">
                小红书图文教程
              </a>
              <a href={evisaLinks.youtube} target="_blank" rel="noopener noreferrer" className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:border-teal-400 dark:border-slate-700 dark:text-slate-200">
                YouTube 教程
              </a>
            </div>
          </div>
        </section>

        {/* pitfalls */}
        <section>
          <SectionTitle>最容易踩的坑</SectionTitle>
          <ul className="space-y-2">
            {pitfalls.map((p, i) => (
              <li key={i} className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-200">
                🚫 {p}
              </li>
            ))}
          </ul>
        </section>

        {/* official sources / real-time */}
        <section>
          <SectionTitle>最新政策 · 官方核实</SectionTitle>
          <p className="mb-3 text-sm text-slate-500">
            签证/入境政策可能随时调整，以下为权威官方源，出发前请到官网确认最新信息。
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {officialSources.map((s) => (
              <a
                key={s.url}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 transition hover:border-teal-400 hover:text-teal-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
              >
                {s.name}
                <span className="text-slate-400">→</span>
              </a>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
