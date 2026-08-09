export type CatalogItem = {
  id: number;
  name: string;
  unitPrice: number;
};

export type EquipmentCatalogItem = CatalogItem & {
  chargeUnit: "per_use" | "per_item";
};

export type EstimateSelection = {
  id: number;
  quantity: number;
  unitPrice: number;
};

export type EstimateBreakdown = {
  roomFee: number;
  equipmentFee: number;
  drinkFee: number;
  totalAmount: number;
};
