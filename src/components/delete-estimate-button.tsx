"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

type DeleteEstimateButtonProps = {
  estimateId: number;
  roomName: string;
};

export function DeleteEstimateButton({
  estimateId,
  roomName,
}: DeleteEstimateButtonProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleDelete() {
    const confirmed = window.confirm(
      `「${roomName}」の見積もりを完全に削除します。\nこの操作は取り消せません。削除しますか？`,
    );
    if (!confirmed) return;

    setIsPending(true);
    setErrorMessage(null);

    const { data, error } = await createClient()
      .from("estimates")
      .delete()
      .eq("id", estimateId)
      .select("id")
      .maybeSingle();

    if (error || !data) {
      setErrorMessage(
        error
          ? `見積もりを削除できませんでした: ${error.message}`
          : "見積もりが見つからないか、削除する権限がありません。",
      );
      setIsPending(false);
      return;
    }

    router.push("/estimates?deleted=1");
    router.refresh();
  }

  return (
    <div>
      <button
        aria-label={`${roomName} の見積もりを削除`}
        className="rounded-full border border-red-300 px-4 py-2 text-sm font-bold text-red-700 transition hover:border-red-400 hover:bg-red-50 disabled:cursor-wait disabled:opacity-60"
        disabled={isPending}
        onClick={handleDelete}
        type="button"
      >
        {isPending ? "削除中…" : "削除"}
      </button>
      {errorMessage && (
        <p className="mt-2 max-w-sm text-sm text-red-700" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
