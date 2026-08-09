import Link from "next/link";
import { notFound } from "next/navigation";

import { getOwnEstimate } from "@/lib/estimates";
import type { EstimateLine } from "@/lib/estimates";

const yen = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 0,
});

const dateTime = new Intl.DateTimeFormat("ja-JP", {
  dateStyle: "long",
  timeStyle: "short",
});

function LineItems({ title, items }: { title: string; items: EstimateLine[] }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-black text-slate-950">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">選択されていません。</p>
      ) : (
        <ul className="mt-4 divide-y divide-slate-200">
          {items.map((item) => (
            <li className="grid grid-cols-[1fr_auto] gap-3 py-4" key={item.id}>
              <div>
                <p className="font-bold text-slate-900">{item.name}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {yen.format(item.unitPrice)} × {item.quantity}
                </p>
              </div>
              <p className="font-bold text-slate-900">
                {yen.format(item.unitPrice * item.quantity)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export const dynamic = "force-dynamic";

export default async function EstimateDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { id: rawId } = await params;
  const { saved } = await searchParams;
  const id = Number(rawId);
  if (!Number.isSafeInteger(id) || id < 1) notFound();

  const estimate = await getOwnEstimate(id);
  if (!estimate) notFound();

  return (
    <main className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
      {saved === "1" && (
        <p
          aria-live="polite"
          className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 font-bold text-emerald-800"
        >
          見積もりを保存しました。
        </p>
      )}
      <Link
        className="text-sm font-bold text-blue-700 hover:underline"
        href="/estimates"
      >
        ← 見積もり履歴へ
      </Link>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">見積もり #{estimate.id}</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">
            {estimate.roomName}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {estimate.companyName} / {estimate.facilityName}
          </p>
        </div>
        <p className="text-sm text-slate-500">
          {dateTime.format(new Date(estimate.createdAt))}
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">利用内容</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-sm text-slate-500">利用時間</dt>
                <dd className="mt-1 text-lg font-bold">
                  {estimate.usageHours}時間
                </dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">利用人数</dt>
                <dd className="mt-1 text-lg font-bold">
                  {estimate.numberOfPeople}名
                </dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">時間単価</dt>
                <dd className="mt-1 text-lg font-bold">
                  {yen.format(estimate.hourlyRate)}
                </dd>
              </div>
            </dl>
          </section>
          <LineItems items={estimate.equipments} title="備品明細" />
          <LineItems items={estimate.drinks} title="飲み物明細" />
        </div>

        <aside className="h-fit rounded-3xl bg-slate-950 p-6 text-white lg:sticky lg:top-6">
          <h2 className="text-xl font-black">料金内訳</h2>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-400">部屋料金</dt>
              <dd>{yen.format(estimate.roomFee)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-400">備品料金</dt>
              <dd>{yen.format(estimate.equipmentFee)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-400">飲み物料金</dt>
              <dd>{yen.format(estimate.drinkFee)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-slate-700 pt-4 text-xl font-black">
              <dt>合計</dt>
              <dd>{yen.format(estimate.totalAmount)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </main>
  );
}
