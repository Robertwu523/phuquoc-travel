"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Link } from "@/i18n/navigation";

type Mode = "signin" | "signup";

export default function AuthPage() {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "error" | "ok"; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    if (mode === "signin") {
      const { error } = await signIn(email.trim(), password);
      if (error) {
        setMsg({ type: "error", text: error });
        setBusy(false);
      } else {
        router.replace("/me");
      }
    } else {
      const { error, needsConfirmation } = await signUp(email.trim(), password);
      setBusy(false);
      if (error) {
        setMsg({ type: "error", text: error });
      } else if (needsConfirmation) {
        setMsg({ type: "ok", text: "注册成功！请去邮箱点击确认链接，然后回来登录。" });
      } else {
        router.replace("/me");
      }
    }
  }

  async function google() {
    setBusy(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setMsg({ type: "error", text: error });
      setBusy(false);
    }
    // On success the browser redirects to Google; nothing else to do.
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-md flex-col justify-center px-4 py-10">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-center text-2xl font-extrabold text-slate-900 dark:text-white">
          {mode === "signin" ? "登录同步" : "创建账号"}
        </h1>
        <p className="mt-1 text-center text-xs text-slate-400">
          登录后行程、记账、清单跨设备同步
        </p>

        {/* tabs */}
        <div className="mt-5 flex rounded-xl border border-slate-200 p-1 dark:border-slate-700">
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setMsg(null); }}
              className={
                "flex-1 rounded-lg py-2 text-sm font-semibold transition " +
                (mode === m
                  ? "bg-[#FF7A45] text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400")
              }
            >
              {m === "signin" ? "登录" : "注册"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-5 space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="邮箱"
            autoComplete="email"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#FF7A45] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="密码（至少 6 位）"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#FF7A45] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />

          {msg && (
            <div className={
              "rounded-lg px-3 py-2 text-xs " +
              (msg.type === "error"
                ? "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-300"
                : "bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-300")
            }>
              {msg.text}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-[#FF7A45] py-2.5 text-sm font-bold text-white transition hover:bg-[#e6662e] disabled:opacity-50"
          >
            {busy ? "请稍候…" : mode === "signin" ? "登录" : "注册"}
          </button>
        </form>

        {/* divider */}
        <div className="my-4 flex items-center gap-3 text-[10px] uppercase tracking-wider text-slate-300">
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
          或
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
        </div>

        <button
          type="button"
          onClick={google}
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          <span className="text-base">🇬</span> 使用 Google 登录
        </button>

        <p className="mt-4 text-center text-[10px] text-slate-400">
          登录即同意数据同步到云端（仅你自己可见）。
          <Link href="/" className="ml-1 underline">返回首页</Link>
        </p>
      </div>
    </div>
  );
}
