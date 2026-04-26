import { tables, DATABASE_ID } from "@/services/appwrite";
import { Query, type Models } from "appwrite";

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
        queries: [Query.limit(100)],
      });
      return response.rows;
    } catch (error) {
      console.error("Erro ao buscar settings:", error);
      return [];
    }
  },
};
