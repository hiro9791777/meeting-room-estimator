import { Suspense } from "react";

import { AuthForm } from "@/components/auth-form";

export default function SignupPage() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-74px)] max-w-6xl items-center justify-center px-5 py-12 sm:px-8">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-10">
        <p className="text-sm font-bold text-blue-700">GET STARTED</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
          新規登録
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          表示名と認証情報を登録して、見積もりを保存できるようにします。
        </p>
        <Suspense
          fallback={
            <p className="mt-8 text-sm text-slate-500">
              フォームを準備しています…
            </p>
          }
        >
          <AuthForm mode="signup" />
        </Suspense>
      </section>
    </main>
  );
}
