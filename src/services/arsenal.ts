import {
  tables,
  TABLE_ARSENALS,
  DATABASE_ID,
  BUCKET_ID,
  storage,
} from "@/services/appwrite";
import { ID, Query } from "appwrite";

export interface IArsenal {
  $id: string;
  name: string;
  type: number | null;
  joule: string | null;
  fps: number | null;
  invoice: string | null;
  category: number | null;
  avatar: string | null;
  maintained_at: Date | null;
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
  async create(data: IArsenal, rowId: string) {
    return await tables.createRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_ARSENALS,
      rowId,
      data,
    });
  },
  async update(rowId: string, data: IArsenal) {
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
    return await tables.deleteRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_ARSENALS,
      rowId,
    });
  },
  async uploadInvoice(rowId: string, file: File) {
    const fileId = `nfe-${rowId}`;

    await storage.createFile({ bucketId: BUCKET_ID, fileId, file });

    const originalUrl = storage.getFileView({ bucketId: BUCKET_ID, fileId });
    const invoice = `${originalUrl}&v=${Date.now()}`;

    return await tables.updateRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_ARSENALS,
      rowId,
      data: {
        invoice,
      },
    });
  },
};
