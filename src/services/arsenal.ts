import { deleteFile, uploadFile } from "@/functions/utils";
import {
  tables,
  TABLE_ARSENALS,
  DATABASE_ID
} from "@/services/appwrite";
import { ID, Query, type Models } from "appwrite";

export interface IArsenal extends Models.Row {
  name: string;
  type: number | null;
  joule: string | null;
  fps: number | null;
  invoice: string | null;
  category: number | null;
  avatar: string | null;
  maintenance_at: Date | string | null;
  operator: string;
  is_favorite: boolean | null;
}

export const ArsenalService = {
  async row(rowId: string) {
    try {
      return await tables.getRow({
        databaseId: DATABASE_ID,
        tableId: TABLE_ARSENALS,
        rowId,
        queries: [Query.select(["*", "operator.*"])],
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
        tableId: TABLE_ARSENALS,
        queries: [Query.orderDesc("$createdAt")],
      });

      return response.rows;
    } catch (error) {
      console.error("Erro ao buscar arsenais:", error);
      return [];
    }
  },
  async listByOperator(operatorId: string): Promise<IArsenal[]> {
    try {
      const response = await tables.listRows<IArsenal>({
        databaseId: DATABASE_ID,
        tableId: TABLE_ARSENALS,
        queries: [
          Query.orderDesc("$createdAt"),
          Query.equal("operator", operatorId)
        ],
      });

      return response.rows;
    } catch (error) {
      console.error("Erro ao buscar arsenais:", error);
      return [];
    }
  },
  async create(data: IArsenal, rowId: string) {
    return await tables.createRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_ARSENALS,
      rowId,
      data,
    });
  },
  async update(rowId: string, data: Partial<IArsenal>) {
    return await tables.updateRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_ARSENALS,
      rowId,
      data,
    });
  },
  async upsert(rowId: string | undefined, data: IArsenal) {
    if (!rowId) {
      rowId = ID.unique();
    }

    return await tables.upsertRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_ARSENALS,
      rowId,
      data,
    });
  },
  async delete(rowId: string) {
    await deleteFile(rowId, 'nfe');

    return await tables.deleteRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_ARSENALS,
      rowId,
    });
  },
  async uploadInvoice(rowId: string, file: File) {
    const urlFormatted = await uploadFile(rowId, file, 'nfe');

    return await tables.updateRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_ARSENALS,
      rowId,
      data: {
        invoice: urlFormatted,
      },
    });
  },
};
