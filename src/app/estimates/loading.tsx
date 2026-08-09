export default function EstimatesLoading() {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className="mx-auto max-w-6xl px-5 py-12 sm:px-8"
    >
      <div className="h-9 w-52 animate-pulse rounded-lg bg-slate-200" />
      <div className="mt-8 space-y-4">
        {[1, 2, 3].map((item) => (
          <div
            className="h-28 animate-pulse rounded-2xl bg-slate-100"
            key={item}
          />
        ))}
      </div>
      <span className="sr-only">見積もりを読み込んでいます。</span>
    </main>
  );
}
