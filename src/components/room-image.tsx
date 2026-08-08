"use client";

import { useState } from "react";

type RoomImageProps = {
  name: string;
  src: string | null;
};

export function RoomImage({ name, src }: RoomImageProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        aria-label={`${name}の画像は準備中です`}
        className="grid aspect-[16/10] place-items-center bg-gradient-to-br from-blue-100 via-slate-100 to-amber-50 text-center text-sm font-semibold text-slate-500"
        role="img"
      >
        <span>
          <span aria-hidden="true" className="mb-2 block text-4xl">
            ◫
          </span>
          PHOTO COMING SOON
        </span>
      </div>
    );
  }

  return (
    // Storageの公開URLはプロジェクトごとに異なるため、通常のimgで表示します。
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={`${name}の室内`}
      className="aspect-[16/10] w-full object-cover"
      onError={() => setHasError(true)}
      src={src}
    />
  );
}
