import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "meeting-room-images";
const UPLOADED_IMAGE =
  /^rooms\/[1-9]\d*\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp)$/i;

type ReplacementResult = {
  error: string | null;
  warning: string | null;
};

// Fail closed: query all rooms (including inactive rooms), not the rendered list.
// The delete RLS policy repeats this check at deletion time.
async function removeIfUnreferenced(
  supabase: SupabaseClient,
  imagePath: string,
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("meeting_rooms")
      .select("id")
      .eq("image_path", imagePath)
      .limit(1);
    if (error || data === null) return false;
    if (data.length > 0) return true;

    const { data: removed, error: removeError } = await supabase.storage
      .from(BUCKET)
      .remove([imagePath]);
    // Storage can report success with no deleted objects when RLS blocks it.
    return (
      !removeError && !!removed?.some((object) => object.name === imagePath)
    );
  } catch {
    return false;
  }
}

export async function replaceRoomImage(
  supabase: SupabaseClient,
  roomId: number,
  file: File,
  imagePath: string,
): Promise<ReplacementResult> {
  // Read the current path instead of trusting possibly stale component props.
  const { data: room, error: readError } = await supabase
    .from("meeting_rooms")
    .select("image_path")
    .eq("id", roomId)
    .single();
  if (readError || !room) {
    return {
      error: "現在の会議室画像を確認できませんでした。再読み込みしてください。",
      warning: null,
    };
  }

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(imagePath, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });
  if (uploadError) {
    return {
      error: `画像をアップロードできませんでした: ${uploadError.message}`,
      warning: null,
    };
  }

  let updateError: { message: string } | null;
  try {
    ({ error: updateError } = await supabase.rpc("set_meeting_room_image", {
      target_image_path: imagePath,
      target_room_id: roomId,
    }));
  } catch {
    updateError = {
      message: "通信に失敗しました。再読み込みして登録状態を確認してください。",
    };
  }
  if (updateError) {
    // Keep rollback cleanup. An ambiguous network error may follow a committed
    // RPC, so never delete a new image that the database already references.
    const cleaned = await removeIfUnreferenced(supabase, imagePath);
    return {
      error: `画像を会議室へ登録できませんでした: ${updateError.message}`,
      warning: cleaned
        ? null
        : "新しい画像の後片付けを確認できませんでした。管理者へ連絡してください。",
    };
  }

  const oldPath: unknown = room.image_path;
  if (
    typeof oldPath === "string" &&
    oldPath !== imagePath &&
    oldPath.startsWith(`rooms/${roomId}/`) &&
    UPLOADED_IMAGE.test(oldPath)
  ) {
    const cleaned = await removeIfUnreferenced(supabase, oldPath);
    if (!cleaned) {
      return {
        error: null,
        warning:
          "画像は更新されましたが、旧画像の後片付けを確認できませんでした。管理者へ連絡してください。",
      };
    }
  }
  return { error: null, warning: null };
}
