"use client";

export default function EstimatesError({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
      <div
        className="rounded-2xl border border-red-200 bg-red-50 p-8 text-red-900"
        role="alert"
      >
        <h1 className="text-2xl font-black">見積もりを表示できませんでした</h1>
        <p className="mt-2 text-sm">
          通信状態を確認して、もう一度お試しください。
        </p>
        <button
          className="mt-5 rounded-full bg-red-700 px-5 py-3 text-sm font-bold text-white hover:bg-red-800"
          onClick={reset}
          type="button"
        >
          再読み込み
        </button>
      </div>
    </main>
  );
}
