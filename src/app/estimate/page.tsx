import { redirect } from "next/navigation";

import { UsageHoursForm } from "@/components/usage-hours-form";
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

  const room = await getActiveRoom(roomId);
  if (!room) redirect("/rooms");

  return (
    <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
      <UsageHoursForm room={room} />
    </main>
  );
}
