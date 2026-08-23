import { redirect } from "next/navigation";

import { AdminMasterManager } from "@/components/admin-master-manager";
import { createClient } from "@/lib/supabase/server";
import type { AdminMasterData, AdminMasterRecord } from "@/types/admin-masters";

export const dynamic = "force-dynamic";

function rows(data: unknown): AdminMasterRecord[] {
  return (data ?? []) as AdminMasterRecord[];
}

export default async function AdminMastersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/admin/masters");

  const { data: isAdmin, error: adminError } = await supabase.rpc("is_admin");
  if (adminError || !isAdmin) redirect("/rooms");

  const [companies, facilities, meetingRooms, equipments, drinks] =
    await Promise.all([
      supabase
        .from("companies")
        .select("id,name,description,is_active")
        .order("id"),
      supabase
        .from("facilities")
        .select("id,company_id,name,prefecture,city,address_line,is_active")
        .order("id"),
      supabase
        .from("meeting_rooms")
        .select(
          "id,facility_id,name,capacity,hourly_rate,description,is_active",
        )
        .order("id"),
      supabase
        .from("equipments")
        .select("id,name,unit_price,charge_unit,is_active")
        .order("id"),
      supabase
        .from("drinks")
        .select("id,name,unit_price,is_active")
        .order("id"),
    ]);

  const failedResult = [
    companies,
    facilities,
    meetingRooms,
    equipments,
    drinks,
  ].find((result) => result.error);
  if (failedResult?.error) {
    throw new Error(
      `マスターデータを取得できませんでした: ${failedResult.error.message}`,
    );
  }

  const data: AdminMasterData = {
    companies: rows(companies.data),
    facilities: rows(facilities.data),
    meeting_rooms: rows(meetingRooms.data),
    equipments: rows(equipments.data),
    drinks: rows(drinks.data),
  };

  return (
    <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
      <div className="mb-10 max-w-3xl">
        <p className="text-sm font-bold tracking-widest text-blue-700">ADMIN</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
          マスターデータを管理
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600">
          運営会社・施設・会議室・備品・飲み物を登録、編集、有効化・無効化します。
        </p>
      </div>
      <AdminMasterManager data={data} />
    </main>
  );
}
