import { tables, TABLE_LOADOUTS, DATABASE_ID } from "@/services/appwrite";
import { Query } from "appwrite";

export interface Loadout {
  $id?: string;
  type: number;
  combat_shirt?: boolean;
  tactical_pants?: boolean;
  combat_boot?: boolean;
  gloves?: boolean;
  bonnie_hat?: boolean;
  ski_mask?: boolean;
  tactical_vest?: boolean;
  tactical_belt?: boolean;
  helmet?: boolean;
  headset?: boolean;
  knee_pads?: boolean;
  holster?: boolean;
  walkie_talkie?: boolean;
}

export const LoadoutService = {
  async row(rowId: string) {
    try {
      return await tables.getRow({
        databaseId: DATABASE_ID,
        tableId: TABLE_LOADOUTS,
        rowId,
      });
    } catch (error) {
      console.error("Erro ao buscar arsenal:", error);
      return [];
    }
  },
  async list() {
    try {
      const response = await tables.listRows({
        databaseId: DATABASE_ID,
        tableId: TABLE_LOADOUTS,
        queries: [Query.orderDesc("$createdAt")],
      });

      return response.rows;
    } catch (error) {
      console.error("Erro ao buscar arsenais:", error);
      return [];
    }
  },
  async update(rowId: string, data: Loadout) {
    return await tables.updateRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_LOADOUTS,
      rowId,
      data,
    });
  },
  async create(data: Loadout, rowId: string) {
    return await tables.createRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_LOADOUTS,
      rowId,
      data,
    });
  },
};
