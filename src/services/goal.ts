import { ID, Query, type Models } from "appwrite";
import { tables, DATABASE_ID } from "@/services/appwrite";
import { deleteFile, uploadFile } from "@/functions/utils";

export const TABLE_GOALS = "goals";

export interface IGoal extends Models.Row {
  title: string;
  description: string;
  deadline: Date | string | null;
  target_amount: number;
  current_amount: number;
  image_url: string | null;
  file: File | null;
}

export const GoalService = {
  async list(): Promise<IGoal[]> {
    try {
      const response = await tables.listRows<IGoal>({
        databaseId: DATABASE_ID,
        tableId: TABLE_GOALS,
        queries: [Query.orderAsc("deadline")],
      });

      return response.rows;
    } catch (error) {
      console.error("Erro ao listar visitantes:", error);
      return [];
    }
  },
  async create(data: IGoal): Promise<IGoal> {
    return await tables.createRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_GOALS,
      rowId: ID.unique(),
      data,
    });
  },
  async update(rowId: string, data: Partial<IGoal>): Promise<IGoal> {
    return await tables.updateRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_GOALS,
      rowId,
      data,
    });
  },
  async upsert(
    rowId: string | undefined,
    data: IGoal,
    file?: File
  ): Promise<IGoal> {
    try {
      const isUpdate = !!rowId;
      const id = rowId || ID.unique();

      if (file instanceof File) {
        if (isUpdate) {
          await deleteFile(id);
        }

        data.image_url = await uploadFile(id, file, 'goal-image');
      }

      return await tables.upsertRow({
        databaseId: DATABASE_ID,
        tableId: TABLE_GOALS,
        rowId: id,
        data,
      });
    } catch (error) {
      console.error("Erro no upsert:", error);
      throw error;
    }
  },
  async delete(rowId: string): Promise<{}> {
    await deleteFile(rowId);

    return await tables.deleteRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_GOALS,
      rowId,
    });
  },
};