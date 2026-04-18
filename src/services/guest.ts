import { ID, Query, type Models } from "appwrite";
import { tables, permissions, DATABASE_ID } from "@/services/appwrite";
import type { IOperator } from "./operator";

export const TABLE_GUESTS = "visitors";

export interface IGuest<TOp = string | IOperator> extends Models.Row {
  name: string;
  codename: string;
  team: string;
  operator: TOp;
  phone: string;
  status?: boolean;
  selected?: IOperator;
}

export const GuestService = {
  async row(rowId: string): Promise<IGuest> {
    try {
      return await tables.getRow<IGuest>({
        databaseId: DATABASE_ID,
        tableId: TABLE_GUESTS,
        rowId,
      });
    } catch (error) {
      console.error("Erro ao buscar arsenal:", error);
      return {} as IGuest;
    }
  },
  async list(): Promise<IGuest<IOperator>[]> {
    try {
      const response = await tables.listRows<IGuest<IOperator>>({
        databaseId: DATABASE_ID,
        tableId: TABLE_GUESTS,
        queries: [Query.orderAsc("name"), Query.select(["*", "operator.*"])],
      });

      return response.rows;
    } catch (error) {
      console.error("Erro ao listar visitantes:", error);
      return [];
    }
  },
  async listByOperator(operatorId: string): Promise<IGuest<IOperator>[]> {
    try {
      const response = await tables.listRows<IGuest<IOperator>>({
        databaseId: DATABASE_ID,
        tableId: TABLE_GUESTS,
        queries: [Query.equal("operator", operatorId)],
      });

      return response.rows;
    } catch (error) {
      console.error("Erro ao listar visitantes:", error);
      return [];
    }
  },
  async create(data: IGuest): Promise<IGuest> {
    return await tables.createRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_GUESTS,
      rowId: ID.unique(),
      data: { ...data, status: true },
    });
  },
  async upsert(
    rowId: string | undefined,
    data: Partial<IGuest>
  ): Promise<IGuest> {
    try {
      const id = rowId || ID.unique();

      return await tables.upsertRow({
        databaseId: DATABASE_ID,
        tableId: TABLE_GUESTS,
        rowId: id,
        data,
        permissions
      });
    } catch (error) {
      console.error("Erro no upsert:", error);
      throw error;
    }
  },
  async delete(rowId: string): Promise<{}> {
    return await tables.deleteRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_GUESTS,
      rowId,
    });
  },
};