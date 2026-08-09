import Link from "next/link";

import { getOwnEstimateSummaries } from "@/lib/estimates";

const yen = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 0,
});

const dateTime = new Intl.DateTimeFormat("ja-JP", {
  dateStyle: "medium",
  timeStyle: "short",
});

export const dynamic = "force-dynamic";

export default async function EstimatesPage() {
  const estimates = await getOwnEstimateSummaries();

  return (
    <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
      <h1 className="text-3xl font-black tracking-tight text-slate-950">
        見積もり履歴
      </h1>
      {estimates.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-slate-600">
          <p>保存済みの見積もりはありません。</p>
          <Link
            className="mt-4 inline-block font-bold text-blue-700 hover:underline"
            href="/rooms"
          >
            会議室を選んで見積もりを作成する
          </Link>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4">
          {estimates.map((estimate) => (
            <li key={estimate.id}>
              <Link
                className="grid min-w-0 gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-400 hover:shadow-md sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                href={`/estimates/${estimate.id}`}
              >
                <div>
                  <p className="text-sm text-slate-500">
                    {dateTime.format(new Date(estimate.createdAt))}
                  </p>
                  <h2 className="mt-1 text-xl font-black text-slate-950">
                    {estimate.roomName}
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    {estimate.usageHours}時間・{estimate.numberOfPeople}名
                  </p>
                </div>
                <p className="text-2xl font-black break-words text-blue-700 sm:text-right">
                  {yen.format(estimate.totalAmount)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
