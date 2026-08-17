import { redirect } from "next/navigation";

import {
  AdminUserManager,
  type AdminUser,
} from "@/components/admin-user-manager";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type AdminUserRow = {
  created_at: string;
  display_name: string;
  email: string | null;
  is_admin: boolean;
  user_id: string;
};

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/admin/users");

  const { data, error } = await supabase.rpc("list_users_for_admin");
  if (error) redirect("/rooms");

  const users: AdminUser[] = ((data ?? []) as AdminUserRow[]).map(
    (account) => ({
      createdAt: account.created_at,
      displayName: account.display_name,
      email: account.email,
      id: account.user_id,
      isAdmin: account.is_admin,
    }),
  );

  return (
    <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
      <div className="mb-10 max-w-3xl">
        <p className="text-sm font-bold tracking-widest text-blue-700">ADMIN</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
          ユーザー権限を管理
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600">
          登録済みユーザーへ管理者権限を付与・解除します。
        </p>
      </div>
      <AdminUserManager currentUserId={user.id} users={users} />
    </main>
  );
}
