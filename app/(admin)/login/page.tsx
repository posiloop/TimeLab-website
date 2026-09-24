"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { authClient } from "@/app/components/admin/auth-client";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const result = await authClient.signIn.email({
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    });

    if (result.error) {
      // 不區分「查無帳號」與「密碼錯誤」，否則可用來探測哪些 Email 有帳號
      setError("帳號或密碼有誤");
      setPending(false);
      return;
    }

    // proxy 把原本要去的頁面放在 from，登入後導回去
    router.push(params.get("from") ?? "/admin");
    router.refresh();
  };

  return (
    <form
      onSubmit={submit}
      className="card-surface flex w-[380px] max-w-full flex-col gap-5 rounded-[20px] p-10 max-md:p-6"
    >
      <div className="flex flex-col items-center gap-2 text-center">
        {/* 與前台頁首同一個標誌，讓後台一眼看得出是同一個站 */}
        <Image
          src="/images/brand/logo-wide.png"
          alt="時光研究室 TiMELAB"
          width={488}
          height={88}
          priority
          className="h-[34px] w-auto object-contain"
        />
        <p className="text-caption text-brand-ink">網站內容管理</p>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-caption text-brand-ink">Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="username"
          className="rounded-[8px] border border-black/15 px-3 py-2 text-sm outline-none focus:border-brand"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-caption text-brand-ink">密碼</span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="rounded-[8px] border border-black/15 px-3 py-2 text-sm outline-none focus:border-brand"
        />
      </label>

      {error && (
        <p role="alert" className="text-caption text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-brand py-3 text-sm font-bold text-white transition-opacity hover:opacity-85 disabled:opacity-50"
      >
        {pending ? "登入中…" : "登入"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-brand-canvas px-4">
      {/* useSearchParams 需要 Suspense 邊界，否則整頁會被迫動態渲染 */}
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
