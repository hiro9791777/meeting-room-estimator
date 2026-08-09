import type { EstimateBreakdown, EstimateSelection } from "@/types/estimates";

export function calculateItemFee(items: EstimateSelection[]) {
  return items.reduce(
    (total, item) => total + item.unitPrice * item.quantity,
    0,
  );
}

export function calculateEstimate(
  hourlyRate: number,
  usageHours: number,
  equipments: EstimateSelection[],
  drinks: EstimateSelection[],
): EstimateBreakdown {
  const roomFee = hourlyRate * usageHours;
  const equipmentFee = calculateItemFee(equipments);
  const drinkFee = calculateItemFee(drinks);

  return {
    roomFee,
    equipmentFee,
    drinkFee,
    totalAmount: roomFee + equipmentFee + drinkFee,
  };
}
