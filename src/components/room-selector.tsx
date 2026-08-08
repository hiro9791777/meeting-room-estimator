"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { RoomImage } from "@/components/room-image";
import type { RoomCardData } from "@/types/rooms";

const yen = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 0,
});

export function RoomSelector({ rooms }: { rooms: RoomCardData[] }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  if (rooms.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <h2 className="font-bold text-slate-900">
          現在選択できる会議室がありません
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          時間をおいてから、もう一度お試しください。
        </p>
      </div>
    );
  }

  return (
    <div>
      <div
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        role="radiogroup"
        aria-label="見積もり対象の会議室"
      >
        {rooms.map((room) => {
          const selected = selectedId === room.id;
          return (
            <button
              aria-checked={selected}
              className={`overflow-hidden rounded-3xl border bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg focus:ring-4 focus:ring-blue-200 focus:outline-none ${
                selected
                  ? "border-blue-600 ring-2 ring-blue-600"
                  : "border-slate-200"
              }`}
              key={room.id}
              onClick={() => setSelectedId(room.id)}
              role="radio"
              type="button"
            >
              <RoomImage name={room.name} src={room.imageUrl} />
              <span className="block p-6">
                <span className="flex items-start justify-between gap-4">
                  <span>
                    <span className="block text-xs font-bold tracking-widest text-blue-700">
                      {room.companyName}
                    </span>
                    <span className="mt-1 block text-xl font-black text-slate-950">
                      {room.name}
                    </span>
                  </span>
                  <span
                    className={`grid size-7 shrink-0 place-items-center rounded-full border ${selected ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 text-transparent"}`}
                  >
                    ✓
                  </span>
                </span>
                <span className="mt-3 block text-sm font-semibold text-slate-700">
                  {room.facilityName}
                </span>
                <span className="mt-1 block text-xs text-slate-500">
                  {room.address}
                </span>
                <span className="mt-4 line-clamp-2 block min-h-10 text-sm leading-5 text-slate-600">
                  {room.description ?? "シンプルで使いやすい貸し会議室です。"}
                </span>
                <span className="mt-5 flex items-end justify-between border-t border-slate-100 pt-5">
                  <span className="text-sm font-semibold text-slate-600">
                    定員 {room.capacity}名
                  </span>
                  <span className="text-lg font-black text-slate-950">
                    {yen.format(room.hourlyRate)}
                    <span className="text-xs font-normal text-slate-500">
                      {" "}
                      / 時間
                    </span>
                  </span>
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="sticky bottom-5 mt-8 flex justify-center">
        <button
          className="rounded-full bg-slate-950 px-8 py-4 font-bold text-white shadow-xl transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={selectedId === null}
          onClick={() =>
            selectedId !== null && router.push(`/estimate?roomId=${selectedId}`)
          }
          type="button"
        >
          {selectedId === null
            ? "会議室を選択してください"
            : "この会議室で見積もる"}
        </button>
      </div>
    </div>
  );
}
