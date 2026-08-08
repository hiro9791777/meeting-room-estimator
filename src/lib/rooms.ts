import { createClient } from "@/lib/supabase/server";
import type { RoomCardData } from "@/types/rooms";

type RoomQueryRow = {
  id: number | string;
  name: string;
  capacity: number;
  hourly_rate: number;
  description: string | null;
  image_path: string | null;
  facilities:
    | {
        name: string;
        prefecture: string;
        city: string;
        address_line: string;
        companies: { name: string } | { name: string }[];
      }
    | {
        name: string;
        prefecture: string;
        city: string;
        address_line: string;
        companies: { name: string } | { name: string }[];
      }[];
};

function first<T>(value: T | T[]) {
  return Array.isArray(value) ? value[0] : value;
}

export async function getActiveRooms(): Promise<RoomCardData[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meeting_rooms")
    .select(
      "id,name,capacity,hourly_rate,description,image_path,facilities!inner(name,prefecture,city,address_line,companies!inner(name))",
    )
    .eq("is_active", true)
    .eq("facilities.is_active", true)
    .eq("facilities.companies.is_active", true)
    .order("hourly_rate");

  if (error) throw new Error(`会議室を取得できませんでした: ${error.message}`);

  return ((data ?? []) as unknown as RoomQueryRow[]).map((row) => {
    const facility = first(row.facilities);
    const company = first(facility.companies);
    const imageUrl = row.image_path
      ? supabase.storage
          .from("meeting-room-images")
          .getPublicUrl(row.image_path).data.publicUrl
      : null;

    return {
      id: Number(row.id),
      name: row.name,
      capacity: row.capacity,
      hourlyRate: row.hourly_rate,
      description: row.description,
      imageUrl,
      companyName: company.name,
      facilityName: facility.name,
      address: `${facility.prefecture}${facility.city}${facility.address_line}`,
    };
  });
}

export async function getActiveRoom(roomId: number) {
  const rooms = await getActiveRooms();
  return rooms.find((room) => room.id === roomId) ?? null;
}
