"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";

import { RoomImage } from "@/components/room-image";
import { createClient } from "@/lib/supabase/client";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const EXTENSIONS_BY_MIME_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type AdminRoomImage = {
  id: number;
  imagePath: string | null;
  imageUrl: string | null;
  name: string;
};

type AdminRoomImageManagerProps = {
  rooms: AdminRoomImage[];
};

export function AdminRoomImageManager({ rooms }: AdminRoomImageManagerProps) {
  const router = useRouter();
  const fileInputs = useRef<Record<number, HTMLInputElement | null>>({});
  const [pendingRoomId, setPendingRoomId] = useState<number | null>(null);
  const [status, setStatus] = useState<{
    roomId: number;
    type: "error" | "success";
    text: string;
  } | null>(null);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
    room: AdminRoomImage,
  ) {
    event.preventDefault();
    setStatus(null);

    const formData = new FormData(event.currentTarget);
    const file = formData.get("image");
    if (!(file instanceof File) || file.size === 0) {
      setStatus({
        roomId: room.id,
        type: "error",
        text: "アップロードする画像を選択してください。",
      });
      return;
    }

    const extension = EXTENSIONS_BY_MIME_TYPE[file.type];
    if (!extension) {
      setStatus({
        roomId: room.id,
        type: "error",
        text: "PNG、JPEG、WebP形式の画像を選択してください。",
      });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setStatus({
        roomId: room.id,
        type: "error",
        text: "画像サイズは5MiB以下にしてください。",
      });
      return;
    }

    setPendingRoomId(room.id);
    const supabase = createClient();
    const imagePath = `rooms/${room.id}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("meeting-room-images")
      .upload(imagePath, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      setStatus({
        roomId: room.id,
        type: "error",
        text: `画像をアップロードできませんでした: ${uploadError.message}`,
      });
      setPendingRoomId(null);
      return;
    }

    const { error: updateError } = await supabase.rpc(
      "set_meeting_room_image",
      {
        target_image_path: imagePath,
        target_room_id: room.id,
      },
    );

    if (updateError) {
      await supabase.storage.from("meeting-room-images").remove([imagePath]);
      setStatus({
        roomId: room.id,
        type: "error",
        text: `画像を会議室へ登録できませんでした: ${updateError.message}`,
      });
      setPendingRoomId(null);
      return;
    }

    const input = fileInputs.current[room.id];
    if (input) input.value = "";
    setStatus({
      roomId: room.id,
      type: "success",
      text: "画像を更新しました。",
    });
    setPendingRoomId(null);
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {rooms.map((room) => (
        <article
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          key={room.id}
        >
          <RoomImage name={room.name} src={room.imageUrl} />
          <div className="p-5">
            <h2 className="text-xl font-black text-slate-950">{room.name}</h2>
            <p className="mt-1 text-xs break-all text-slate-500">
              {room.imagePath ?? "画像未登録"}
            </p>
            <form
              className="mt-5 space-y-3"
              onSubmit={(event) => handleSubmit(event, room)}
            >
              <label
                className="block text-sm font-bold text-slate-800"
                htmlFor={`room-image-${room.id}`}
              >
                新しい画像
              </label>
              <input
                accept="image/png,image/jpeg,image/webp"
                className="block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:font-bold file:text-blue-700"
                id={`room-image-${room.id}`}
                name="image"
                ref={(element) => {
                  fileInputs.current[room.id] = element;
                }}
                required
                type="file"
              />
              <p className="text-xs text-slate-500">
                PNG・JPEG・WebP、5MiB以下
              </p>
              {status?.roomId === room.id && (
                <p
                  className={`rounded-xl px-4 py-3 text-sm ${
                    status.type === "success"
                      ? "bg-emerald-50 text-emerald-800"
                      : "bg-red-50 text-red-700"
                  }`}
                  role={status.type === "error" ? "alert" : "status"}
                >
                  {status.text}
                </p>
              )}
              <button
                className="rounded-xl bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
                disabled={pendingRoomId !== null}
                type="submit"
              >
                {pendingRoomId === room.id ? "アップロード中…" : "画像を更新"}
              </button>
            </form>
          </div>
        </article>
      ))}
    </div>
  );
}
