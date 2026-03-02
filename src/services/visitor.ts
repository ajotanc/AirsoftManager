import { ID, Query, type Models } from "appwrite";
import { tables, permissions, DATABASE_ID } from "@/services/appwrite";
import type { IOperator } from "./operator";

export const TABLE_VISITORS = "visitors"; // Crie esta coleção no Appwrite

export interface IVisitor<TOp = string | IOperator> extends Models.Row {
  name: string;
  codename: string;
  team: string;
  operator: TOp;
  phone: string;
  status?: boolean;
  selected?: IOperator;
}

export const VisitorService = {
  async row(rowId: string): Promise<IVisitor> {
    try {
      return await tables.getRow<IVisitor>({
        databaseId: DATABASE_ID,
        tableId: TABLE_VISITORS,
        rowId,
      });
    } catch (error) {
      console.error("Erro ao buscar arsenal:", error);
      return {} as IVisitor;
    }
  },
  async list(): Promise<IVisitor<IOperator>[]> {
    try {
      const response = await tables.listRows<IVisitor<IOperator>>({
        databaseId: DATABASE_ID,
        tableId: TABLE_VISITORS,
        queries: [Query.orderAsc("name"), Query.select(["*", "operator.*"])],
      });

      return response.rows;
    } catch (error) {
      console.error("Erro ao listar visitantes:", error);
      return [];
    }
  },
  async listByOperator(operatorId: string): Promise<IVisitor<IOperator>[]> {
    try {
      const response = await tables.listRows<IVisitor<IOperator>>({
        databaseId: DATABASE_ID,
        tableId: TABLE_VISITORS,
        queries: [Query.equal("operator", operatorId)],
      });

      return response.rows;
    } catch (error) {
      console.error("Erro ao listar visitantes:", error);
      return [];
    }
  },
  async create(data: IVisitor): Promise<IVisitor> {
    return await tables.createRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_VISITORS,
      rowId: ID.unique(),
      data: { ...data, status: true },
    });
  },
  async upsert(
    rowId: string | undefined,
    data: Partial<IVisitor>
  ): Promise<IVisitor> {
    try {
      const id = rowId || ID.unique();

      return await tables.upsertRow({
        databaseId: DATABASE_ID,
        tableId: TABLE_VISITORS,
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
      tableId: TABLE_VISITORS,
      rowId,
    });
  },
};