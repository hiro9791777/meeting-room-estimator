import Link from "next/link";

import { LogoutButton } from "@/components/logout-button";
import { createClient } from "@/lib/supabase/server";

export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let displayName: string | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle();
    displayName = data?.display_name ?? user.email?.split("@")[0] ?? "ユーザー";
  }

  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Link
          className="text-lg font-black tracking-tight text-slate-950"
          href="/rooms"
        >
          Room Estimate
        </Link>
        <nav
          aria-label="メインナビゲーション"
          className="flex flex-wrap items-center gap-3"
        >
          <Link
            className="rounded-full px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            href="/rooms"
          >
            会議室を探す
          </Link>
          {user ? (
            <>
              <Link
                className="rounded-full px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                href="/estimates"
              >
                見積もり履歴
              </Link>
              <span className="hidden text-sm text-slate-500 sm:inline">
                {displayName} さん
              </span>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link
                className="rounded-full px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                href="/login"
              >
                ログイン
              </Link>
              <Link
                className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                href="/signup"
              >
                新規登録
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
