"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";

type AuthFormProps = {
  mode: "login" | "signup";
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const isSignup = mode === "signup";

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsPending(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const displayName = String(formData.get("displayName") ?? "").trim();

    if (!email || !password || (isSignup && !displayName)) {
      setError("すべての必須項目を入力してください。");
      setIsPending(false);
      return;
    }

    if (password.length < 8) {
      setError("パスワードは8文字以上で入力してください。");
      setIsPending(false);
      return;
    }

    const supabase = createClient();

    if (isSignup) {
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/rooms`,
        },
      });

      if (signupError) {
        setError(
          "登録できませんでした。入力内容または登録済みメールアドレスをご確認ください。",
        );
        setIsPending(false);
        return;
      }

      if (!data.session) {
        setMessage(
          "確認メールを送信しました。メール内のリンクから登録を完了してください。",
        );
        setIsPending(false);
        return;
      }

      router.push("/rooms");
      router.refresh();
      return;
    }

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (loginError) {
      setError(
        "ログインできませんでした。メールアドレスとパスワードをご確認ください。",
      );
      setIsPending(false);
      return;
    }

    const next = searchParams.get("next");
    router.push(next?.startsWith("/") ? next : "/rooms");
    router.refresh();
  }

  return (
    <form className="mt-8 space-y-5" noValidate onSubmit={handleSubmit}>
      {isSignup && (
        <div>
          <label
            className="mb-2 block text-sm font-semibold text-slate-800"
            htmlFor="displayName"
          >
            表示名
          </label>
          <input
            aria-describedby={error ? "auth-error" : undefined}
            aria-invalid={Boolean(error)}
            autoComplete="name"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 transition outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            id="displayName"
            name="displayName"
            required
            type="text"
          />
        </div>
      )}
      <div>
        <label
          className="mb-2 block text-sm font-semibold text-slate-800"
          htmlFor="email"
        >
          メールアドレス
        </label>
        <input
          aria-describedby={error ? "auth-error" : undefined}
          aria-invalid={Boolean(error)}
          autoComplete="email"
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 transition outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          id="email"
          name="email"
          required
          type="email"
        />
      </div>
      <div>
        <label
          className="mb-2 block text-sm font-semibold text-slate-800"
          htmlFor="password"
        >
          パスワード
        </label>
        <input
          aria-describedby={
            error ? "password-hint auth-error" : "password-hint"
          }
          aria-invalid={Boolean(error)}
          autoComplete={isSignup ? "new-password" : "current-password"}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 transition outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          id="password"
          minLength={8}
          name="password"
          required
          type="password"
        />
        <p className="mt-2 text-xs text-slate-500" id="password-hint">
          8文字以上で入力してください。
        </p>
      </div>

      <div>
        {error && (
          <p
            className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 outline-none"
            id="auth-error"
            ref={errorRef}
            role="alert"
            tabIndex={-1}
          >
            {error}
          </p>
        )}
        {message && (
          <p
            className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
            role="status"
          >
            {message}
          </p>
        )}
      </div>

      <button
        className="w-full rounded-xl bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "送信中…" : isSignup ? "アカウントを作成" : "ログイン"}
      </button>

      <p className="text-center text-sm text-slate-600">
        {isSignup
          ? "すでにアカウントをお持ちですか？"
          : "アカウントをお持ちでないですか？"}{" "}
        <Link
          className="font-bold text-blue-700 hover:underline"
          href={isSignup ? "/login" : "/signup"}
        >
          {isSignup ? "ログイン" : "新規登録"}
        </Link>
      </p>
    </form>
  );
}
