const setupItems = ["Next.js + TypeScript", "Supabase", "Prisma", "Tailwind CSS"];

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <section className="w-full max-w-3xl rounded-3xl bg-white p-8 shadow-[0_24px_70px_rgba(25,55,109,0.12)] sm:p-14">
        <span className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
          Environment ready
        </span>
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
          会議室の見積もりを、
          <span className="text-blue-600">もっと簡単に。</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
          Meeting Room Estimator の開発環境が起動しました。ここから会議室選択と料金計算の機能を実装します。
        </p>
        <ul className="mt-10 grid gap-3 sm:grid-cols-2">
          {setupItems.map((item) => (
            <li key={item} className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-slate-700">
              <span aria-hidden="true" className="grid size-6 place-items-center rounded-full bg-emerald-100 text-sm text-emerald-700">
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
