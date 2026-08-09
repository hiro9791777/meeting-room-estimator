import { redirect } from "next/navigation";

import { EstimateForm } from "@/components/estimate-form";
import { getActiveCatalogs } from "@/lib/catalog";
import { getActiveRoom } from "@/lib/rooms";

export const dynamic = "force-dynamic";

export default async function EstimatePage({
  searchParams,
}: {
  searchParams: Promise<{ roomId?: string }>;
}) {
  const { roomId: rawRoomId } = await searchParams;
  const roomId = Number(rawRoomId);

  if (!Number.isSafeInteger(roomId) || roomId < 1) redirect("/rooms");

  const [room, catalogs] = await Promise.all([
    getActiveRoom(roomId),
    getActiveCatalogs(),
  ]);
  if (!room) redirect("/rooms");

  return (
    <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
      <EstimateForm
        drinks={catalogs.drinks}
        equipments={catalogs.equipments}
        room={room}
      />
    </main>
  );
}
