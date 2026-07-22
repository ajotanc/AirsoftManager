import { tables, permissions, DATABASE_ID } from "@/services/appwrite";
import { ID, Query, type Models } from "appwrite";

export const TABLE_SETTINGS = "settings";

export interface ISetting extends Models.Row {
  key: string;
  value: string;
  description: string;
  args?: string;
}

export const SettingsService = {
  async list(): Promise<ISetting[]> {
    try {
      const response = await tables.listRows<ISetting>({
        databaseId: DATABASE_ID,
        tableId: TABLE_SETTINGS,
        queries: [
          Query.limit(100)
        ],
      });
      return response.rows;
    } catch (error) {
      console.error("Erro ao buscar settings:", error);
      return [];
    }
  },

  async upsert(rowId: string | undefined, data: Partial<ISetting>): Promise<ISetting> {
    const id = rowId || ID.unique();

    return await tables.upsertRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_SETTINGS,
      rowId: id,
      data,
      permissions
    });
  },

  async delete(rowId: string): Promise<boolean> {
    try {
      await tables.deleteRow({
        databaseId: DATABASE_ID,
        tableId: TABLE_SETTINGS,
        rowId,
      });
      return true;
    } catch (error) {
      console.error("Erro ao deletar setting:", error);
      return false;
    }
  }
};
