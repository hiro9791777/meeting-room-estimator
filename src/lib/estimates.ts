import { createClient } from "@/lib/supabase/server";

export type EstimateSummary = {
  id: number;
  createdAt: string;
  roomName: string;
  usageHours: number;
  numberOfPeople: number;
  totalAmount: number;
};

export type EstimateLine = {
  id: number;
  name: string;
  unitPrice: number;
  quantity: number;
};

export type EstimateDetail = EstimateSummary & {
  companyName: string;
  facilityName: string;
  hourlyRate: number;
  roomFee: number;
  equipmentFee: number;
  drinkFee: number;
  equipments: EstimateLine[];
  drinks: EstimateLine[];
};

export async function getOwnEstimateSummaries(): Promise<EstimateSummary[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("estimates")
    .select(
      "id,created_at,meeting_room_name_snapshot,usage_hours,number_of_people,total_amount",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error)
    throw new Error(`見積もり履歴を取得できませんでした: ${error.message}`);

  return (data ?? []).map((estimate) => ({
    id: Number(estimate.id),
    createdAt: estimate.created_at,
    roomName: estimate.meeting_room_name_snapshot,
    usageHours: estimate.usage_hours,
    numberOfPeople: estimate.number_of_people,
    totalAmount: estimate.total_amount,
  }));
}

export async function getOwnEstimate(
  id: number,
): Promise<EstimateDetail | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: estimate, error } = await supabase
    .from("estimates")
    .select(
      "id,created_at,company_name_snapshot,facility_name_snapshot,meeting_room_name_snapshot,hourly_rate_snapshot,usage_hours,number_of_people,room_fee,equipment_fee,drink_fee,total_amount",
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error)
    throw new Error(`見積もりを取得できませんでした: ${error.message}`);
  if (!estimate) return null;

  const [equipmentResult, drinkResult] = await Promise.all([
    supabase
      .from("estimate_equipments")
      .select("id,equipment_name_snapshot,unit_price,quantity")
      .eq("estimate_id", id)
      .order("id"),
    supabase
      .from("estimate_drinks")
      .select("id,drink_name_snapshot,unit_price,quantity")
      .eq("estimate_id", id)
      .order("id"),
  ]);

  if (equipmentResult.error) {
    throw new Error(
      `備品明細を取得できませんでした: ${equipmentResult.error.message}`,
    );
  }
  if (drinkResult.error) {
    throw new Error(
      `飲み物明細を取得できませんでした: ${drinkResult.error.message}`,
    );
  }

  return {
    id: Number(estimate.id),
    createdAt: estimate.created_at,
    companyName: estimate.company_name_snapshot,
    facilityName: estimate.facility_name_snapshot,
    roomName: estimate.meeting_room_name_snapshot,
    hourlyRate: estimate.hourly_rate_snapshot,
    usageHours: estimate.usage_hours,
    numberOfPeople: estimate.number_of_people,
    roomFee: estimate.room_fee,
    equipmentFee: estimate.equipment_fee,
    drinkFee: estimate.drink_fee,
    totalAmount: estimate.total_amount,
    equipments: (equipmentResult.data ?? []).map((item) => ({
      id: Number(item.id),
      name: item.equipment_name_snapshot,
      unitPrice: item.unit_price,
      quantity: item.quantity,
    })),
    drinks: (drinkResult.data ?? []).map((item) => ({
      id: Number(item.id),
      name: item.drink_name_snapshot,
      unitPrice: item.unit_price,
      quantity: item.quantity,
    })),
  };
}
