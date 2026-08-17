import { redirect } from "next/navigation";

import {
  AdminRoomImageManager,
  type AdminRoomImage,
} from "@/components/admin-room-image-manager";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RoomRow = {
  id: number | string;
  image_path: string | null;
  name: string;
};

export default async function AdminRoomsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/admin/rooms");

  const { data: isAdmin, error: adminError } = await supabase.rpc("is_admin");
  if (adminError || !isAdmin) redirect("/rooms");

  const { data, error } = await supabase
    .from("meeting_rooms")
    .select("id,name,image_path")
    .order("id");

  if (error) {
    throw new Error(`会議室を取得できませんでした: ${error.message}`);
  }

  const rooms: AdminRoomImage[] = ((data ?? []) as RoomRow[]).map((room) => ({
    id: Number(room.id),
    imagePath: room.image_path,
    imageUrl: room.image_path
      ? supabase.storage
          .from("meeting-room-images")
          .getPublicUrl(room.image_path).data.publicUrl
      : null,
    name: room.name,
  }));

  return (
    <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
      <div className="mb-10 max-w-3xl">
        <p className="text-sm font-bold tracking-widest text-blue-700">ADMIN</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
          会議室画像を管理
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600">
          会議室ごとの代表画像をアップロードして差し替えます。
        </p>
      </div>
      <AdminRoomImageManager rooms={rooms} />
    </main>
  );
}
