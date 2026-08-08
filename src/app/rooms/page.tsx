import { RoomSelector } from "@/components/room-selector";
import { getActiveRooms } from "@/lib/rooms";

export const dynamic = "force-dynamic";

export default async function RoomsPage() {
  const rooms = await getActiveRooms();

  return (
    <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
      <div className="mb-10 max-w-3xl">
        <p className="text-sm font-bold tracking-widest text-blue-700">
          MEETING ROOMS
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
          目的に合う会議室を選ぶ
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600">
          定員や料金を比較して、見積もりを作成する会議室を1件選択してください。
        </p>
      </div>
      <RoomSelector rooms={rooms} />
    </main>
  );
}
