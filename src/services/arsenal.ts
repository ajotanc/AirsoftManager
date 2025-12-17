import {
  tables,
  TABLE_ARSENALS,
  DATABASE_ID,
  BUCKET_ID,
  storage,
} from "@/services/appwrite";
import { Query } from "appwrite";

export interface Arsenal {
  $id?: string;
  name: string;
  type: string;
  joule?: number;
  fps?: number;
  serial_number?: string;
  category: number;
  avatar?: string;
  maintained_at: Date;
}

export const ArsenalService = {
  async row(rowId: string) {
    try {
      return await tables.getRow({
        databaseId: DATABASE_ID,
        tableId: TABLE_ARSENALS,
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
        tableId: TABLE_ARSENALS,
        queries: [Query.orderDesc("$createdAt")],
      });

      return response.rows;
    } catch (error) {
      console.error("Erro ao buscar arsenais:", error);
      return [];
    }
  },
  async update(rowId: string, data: Arsenal) {
    return await tables.updateRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_ARSENALS,
      rowId,
      data,
    });
  },
  async create(data: Arsenal, rowId: string) {
    return await tables.createRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_ARSENALS,
      rowId,
      data,
    });
  },
  async changeAvatar(rowId: string, file: File) {
    const fileId = `arsenal-${rowId}`;

    await storage.deleteFile({ bucketId: BUCKET_ID, fileId });
    await storage.createFile({ bucketId: BUCKET_ID, fileId, file });

    const originalUrl = storage.getFileView({ bucketId: BUCKET_ID, fileId });
    const avatar = `${originalUrl}&v=${Date.now()}`;

    return await tables.updateRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_ARSENALS,
      rowId,
      data: {
        avatar,
      },
    });
  },
};
