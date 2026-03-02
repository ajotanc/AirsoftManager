import { ID, Query, type Models } from "appwrite";
import { tables, permissions, DATABASE_ID } from "@/services/appwrite";
import { deleteFile, uploadFile } from "@/functions/utils";
import dayjs from "dayjs";

export const TABLE_CASHFLOW = "cashflow";

export interface ICashflow extends Models.Row {
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: Date | string | null;
  reference: string;

  receipt_url: string | null;
  payment?: string;
  file?: File | null;
}

export const CashflowService = {
  async list(): Promise<ICashflow[]> {
    try {
      const reference = dayjs().format("MM/YYYY");

      const response = await tables.listRows<ICashflow>({
        databaseId: DATABASE_ID,
        tableId: TABLE_CASHFLOW,
        queries: [
          Query.orderAsc("date"),
          Query.equal("reference", reference),
          Query.limit(1000),
        ],
      });

      return response.rows;
    } catch (error) {
      console.error("Erro ao listar visitantes:", error);
      return [];
    }
  },
  async listAnnual(year?: string | number): Promise<ICashflow[]> {
    try {
      const referenceYear = year ? year.toString() : dayjs().format("YYYY");

      const response = await tables.listRows<ICashflow>({
        databaseId: DATABASE_ID,
        tableId: TABLE_CASHFLOW,
        queries: [
          Query.orderAsc("date"),
          Query.endsWith("reference", referenceYear),
          Query.limit(1000),
        ],
      });

      return response.rows;
    } catch (error) {
      console.error("Erro ao listar visitantes:", error);
      return [];
    }
  },
  async create(data: ICashflow): Promise<ICashflow> {
    return await tables.createRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_CASHFLOW,
      rowId: ID.unique(),
      data,
      permissions
    });
  },
  async upsert(
    rowId: string | undefined,
    data: ICashflow,
    file?: File
  ): Promise<ICashflow> {
    try {
      const isUpdate = !!rowId;
      const id = rowId || ID.unique();

      if (file instanceof File) {
        if (isUpdate) {
          await deleteFile(id);
        }

        data.receipt_url = await uploadFile(id, file, 'receipt');
      }

      const date = dayjs(data.date);
      const reference = date.format("MM/YYYY");

      return await tables.upsertRow({
        databaseId: DATABASE_ID,
        tableId: TABLE_CASHFLOW,
        rowId: id,
        data: {
          ...data,
          reference
        },
        permissions
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
      tableId: TABLE_CASHFLOW,
      rowId,
    });
  },
};