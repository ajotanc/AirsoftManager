import { tables, permissions, DATABASE_ID } from "@/services/appwrite";
import { ID, Query, type Models } from "appwrite";

export const TABLE_SETTINGS = "settings";

export interface ISetting extends Models.Row {
  tactical_map?: boolean;
  global_map?: boolean;
  tournament_active?: boolean;
  team_name?: string;
  recruitment_open?: boolean;
  registration_start_date?: string;
  blue_base?: string;
  yellow_base?: string;
  blue_team?: string[];
  yellow_team?: string[];
  rangers?: string[];
  split_teams?: boolean;
  monthly_fee?: number;
  max_pending_payments?: number;
}

export const SettingsService = {
  async get(): Promise<ISetting> {
    try {
      const { rows } = await tables.listRows<ISetting>({
        databaseId: DATABASE_ID,
        tableId: TABLE_SETTINGS,
        queries: [
          Query.limit(1)
        ],
      });
      return rows[0] ?? ({} as ISetting);
    } catch (error) {
      console.error("Erro ao buscar settings:", error);
      return {} as ISetting;
    }
  },
  async upsert(rowId: string | undefined, data: Partial<ISetting>): Promise<ISetting> {
    const isUpdate = !!rowId;
    const id = rowId || ID.unique();

    if (isUpdate) {
      return await tables.updateRow({
        databaseId: DATABASE_ID,
        tableId: TABLE_SETTINGS,
        rowId: id,
        data,
        permissions
      });
    }

    return await tables.createRow({
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
