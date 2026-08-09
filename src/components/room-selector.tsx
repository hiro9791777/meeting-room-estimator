"use client";

import { useRouter } from "next/navigation";
import { type KeyboardEvent, useRef, useState } from "react";

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
  const roomButtons = useRef<Array<HTMLButtonElement | null>>([]);

  function handleRoomKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) {
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (currentIndex + 1) % rooms.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (currentIndex - 1 + rooms.length) % rooms.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = rooms.length - 1;
    }

    if (nextIndex === null) return;
    event.preventDefault();
    setSelectedId(rooms[nextIndex].id);
    roomButtons.current[nextIndex]?.focus();
  }

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
        {rooms.map((room, index) => {
          const selected = selectedId === room.id;
          return (
            <button
              aria-checked={selected}
              aria-label={`${room.name}、定員${room.capacity}名、1時間${yen.format(room.hourlyRate)}`}
              className={`overflow-hidden rounded-3xl border bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg focus:ring-4 focus:ring-blue-200 focus:outline-none motion-reduce:hover:translate-y-0 ${
                selected
                  ? "border-blue-600 ring-2 ring-blue-600"
                  : "border-slate-200"
              }`}
              key={room.id}
              onKeyDown={(event) => handleRoomKeyDown(event, index)}
              onClick={() => setSelectedId(room.id)}
              ref={(element) => {
                roomButtons.current[index] = element;
              }}
              role="radio"
              tabIndex={
                selectedId === null ? (index === 0 ? 0 : -1) : selected ? 0 : -1
              }
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
                    aria-hidden="true"
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
                <span className="mt-5 flex flex-wrap items-end justify-between gap-2 border-t border-slate-100 pt-5">
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

      <div className="sticky bottom-3 mt-8 flex justify-center px-1 pb-[env(safe-area-inset-bottom)] sm:bottom-5">
        <button
          className="w-full rounded-full bg-slate-950 px-6 py-4 font-bold text-white shadow-xl transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto sm:px-8"
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
