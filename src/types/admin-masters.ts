export type AdminMasterRecord = {
  id: number;
  is_active: boolean;
  [key: string]: boolean | number | string | null;
};

export type AdminMasterData = {
  companies: AdminMasterRecord[];
  drinks: AdminMasterRecord[];
  equipments: AdminMasterRecord[];
  facilities: AdminMasterRecord[];
  meeting_rooms: AdminMasterRecord[];
};

export type AdminMasterKind = keyof AdminMasterData;
