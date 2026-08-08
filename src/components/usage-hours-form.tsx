"use client";

import Link from "next/link";
import { useState } from "react";

import type { RoomCardData } from "@/types/rooms";

const yen = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 0,
});

export function UsageHoursForm({ room }: { room: RoomCardData }) {
  const [rawHours, setRawHours] = useState("1");
  const hours = Number(rawHours);
  const isValid = Number.isInteger(hours) && hours >= 1;
  const roomFee = isValid ? room.hourlyRate * hours : 0;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-bold tracking-widest text-blue-700">
          STEP 1
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
          利用時間を入力
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          1時間単位で利用時間を入力してください。料金は入力に合わせて更新されます。
        </p>

        <div className="mt-8 max-w-sm">
          <label
            className="mb-2 block text-sm font-bold text-slate-800"
            htmlFor="usage-hours"
          >
            利用時間
          </label>
          <div className="flex items-center gap-3">
            <input
              aria-describedby={!isValid ? "usage-hours-error" : undefined}
              aria-invalid={!isValid}
              className="w-32 rounded-xl border border-slate-300 px-4 py-3 text-lg font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              id="usage-hours"
              inputMode="numeric"
              min={1}
              onChange={(event) => setRawHours(event.target.value)}
              step={1}
              type="number"
              value={rawHours}
            />
            <span className="font-semibold text-slate-700">時間</span>
          </div>
          {!isValid && (
            <p className="mt-2 text-sm text-red-700" id="usage-hours-error">
              1以上の整数を入力してください。
            </p>
          )}
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            className="rounded-full border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
            href="/rooms"
          >
            会議室を選び直す
          </Link>
          <button
            className="rounded-full bg-slate-300 px-5 py-3 text-sm font-bold text-white"
            disabled
            type="button"
          >
            人数入力へ（次のステップ）
          </button>
        </div>
      </section>

      <aside className="h-fit rounded-3xl bg-slate-950 p-6 text-white lg:sticky lg:top-6">
        <p className="text-xs font-bold tracking-widest text-blue-300">
          SELECTED ROOM
        </p>
        <h2 className="mt-2 text-2xl font-black">{room.name}</h2>
        <p className="mt-2 text-sm text-slate-300">
          {room.companyName} / {room.facilityName}
        </p>
        <dl className="mt-6 space-y-3 border-t border-slate-700 pt-6 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-slate-400">定員</dt>
            <dd>{room.capacity}名</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-400">時間単価</dt>
            <dd>{yen.format(room.hourlyRate)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-400">利用時間</dt>
            <dd>{isValid ? `${hours}時間` : "—"}</dd>
          </div>
        </dl>
        <div className="mt-6 border-t border-slate-700 pt-6">
          <p className="text-sm text-slate-400">現在の部屋料金</p>
          <p aria-live="polite" className="mt-1 text-3xl font-black">
            {isValid ? yen.format(roomFee) : "—"}
          </p>
        </div>
      </aside>
    </div>
  );
}
