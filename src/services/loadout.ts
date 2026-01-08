import { tables, TABLE_LOADOUTS, DATABASE_ID } from "@/services/appwrite";
import { ID, Query } from "appwrite";

export interface ILoadout {
  $id: string;
  type_uniform: number;
  combat_shirt: boolean | null;
  tactical_pants: boolean | null;
  combat_boot: boolean | null;
  gloves: boolean | null;
  bonnie_hat: boolean | null;
  ski_mask: boolean | null;
  tactical_vest: boolean | null;
  tactical_belt: boolean | null;
  helmet: boolean | null;
  headset: boolean | null;
  knee_pads: boolean | null;
  holster: boolean | null;
  walkie_talkie: boolean | null;
  operator: string;
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
  async update(rowId: string, data: ILoadout) {
    return await tables.updateRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_LOADOUTS,
      rowId,
      data,
    });
  },
  async upsert(rowId: string, data: ILoadout) {
    if (!rowId) {
      rowId = ID.unique();
    }

    return await tables.upsertRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_LOADOUTS,
      rowId,
      data,
    });
  },
  async delete(rowId: string) {
    return await tables.deleteRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_LOADOUTS,
      rowId,
    });
  },
  async create(data: ILoadout, rowId: string) {
    return await tables.createRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_LOADOUTS,
      rowId,
      data,
    });
  },
};
