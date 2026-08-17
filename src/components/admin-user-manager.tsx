"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

export type AdminUser = {
  createdAt: string;
  displayName: string;
  email: string | null;
  id: string;
  isAdmin: boolean;
};

type AdminUserManagerProps = {
  currentUserId: string;
  users: AdminUser[];
};

export function AdminUserManager({
  currentUserId,
  users,
}: AdminUserManagerProps) {
  const router = useRouter();
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [status, setStatus] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  async function updateRole(user: AdminUser) {
    const nextIsAdmin = !user.isAdmin;
    setPendingUserId(user.id);
    setStatus(null);

    const supabase = createClient();
    const { error } = await supabase.rpc("set_user_admin", {
      target_is_admin: nextIsAdmin,
      target_user_id: user.id,
    });

    if (error) {
      setStatus({
        type: "error",
        text:
          error.code === "23514"
            ? "最後の管理者は解除できません。先に別の管理者を追加してください。"
            : `権限を更新できませんでした: ${error.message}`,
      });
      setPendingUserId(null);
      return;
    }

    setStatus({
      type: "success",
      text: `${user.displayName}さんを${nextIsAdmin ? "管理者に設定" : "一般ユーザーに変更"}しました。`,
    });
    setPendingUserId(null);
    router.refresh();
  }

  return (
    <div>
      {status && (
        <p
          className={`mb-5 rounded-xl px-4 py-3 text-sm ${
            status.type === "success"
              ? "bg-emerald-50 text-emerald-800"
              : "bg-red-50 text-red-700"
          }`}
          role={status.type === "error" ? "alert" : "status"}
        >
          {status.text}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left">
            <thead className="bg-slate-50 text-xs tracking-wide text-slate-600 uppercase">
              <tr>
                <th className="px-5 py-4 font-bold" scope="col">
                  ユーザー
                </th>
                <th className="px-5 py-4 font-bold" scope="col">
                  登録日
                </th>
                <th className="px-5 py-4 font-bold" scope="col">
                  権限
                </th>
                <th className="px-5 py-4 text-right font-bold" scope="col">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-5 py-4">
                    <p className="font-bold text-slate-950">
                      {user.displayName}
                      {user.id === currentUserId && (
                        <span className="ml-2 text-xs font-semibold text-blue-700">
                          あなた
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {user.email ?? "メールアドレスなし"}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {new Intl.DateTimeFormat("ja-JP", {
                      dateStyle: "medium",
                    }).format(new Date(user.createdAt))}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                        user.isAdmin
                          ? "bg-blue-100 text-blue-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {user.isAdmin ? "管理者" : "一般ユーザー"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      className={`rounded-xl px-4 py-2 text-sm font-bold transition disabled:cursor-wait disabled:opacity-60 ${
                        user.isAdmin
                          ? "border border-slate-300 text-slate-700 hover:bg-slate-50"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                      disabled={pendingUserId !== null}
                      onClick={() => updateRole(user)}
                      type="button"
                    >
                      {pendingUserId === user.id
                        ? "更新中…"
                        : user.isAdmin
                          ? "管理者を解除"
                          : "管理者にする"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
