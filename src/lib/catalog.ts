import { createClient } from "@/lib/supabase/server";
import type { CatalogItem, EquipmentCatalogItem } from "@/types/estimates";

export async function getActiveCatalogs(): Promise<{
  equipments: EquipmentCatalogItem[];
  drinks: CatalogItem[];
}> {
  const supabase = await createClient();
  const [equipmentResult, drinkResult] = await Promise.all([
    supabase
      .from("equipments")
      .select("id,name,unit_price,charge_unit")
      .eq("is_active", true)
      .order("id"),
    supabase
      .from("drinks")
      .select("id,name,unit_price")
      .eq("is_active", true)
      .order("id"),
  ]);

  if (equipmentResult.error) {
    throw new Error(
      `備品を取得できませんでした: ${equipmentResult.error.message}`,
    );
  }
  if (drinkResult.error) {
    throw new Error(
      `飲み物を取得できませんでした: ${drinkResult.error.message}`,
    );
  }

  return {
    equipments: (equipmentResult.data ?? []).map((item) => ({
      id: Number(item.id),
      name: item.name,
      unitPrice: item.unit_price,
      chargeUnit: item.charge_unit as EquipmentCatalogItem["chargeUnit"],
    })),
    drinks: (drinkResult.data ?? []).map((item) => ({
      id: Number(item.id),
      name: item.name,
      unitPrice: item.unit_price,
    })),
  };
}
