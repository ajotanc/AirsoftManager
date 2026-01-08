import { tables, TABLE_SKILL_RATINGS, DATABASE_ID } from "@/services/appwrite";
import { ID, Query, type Models } from "appwrite";
import type { IOperator } from "./operator";

export interface IRating<VOp = string | IOperator, TOp = string | IOperator>
  extends Models.Row {
  voter: VOp;
  target: TOp;
  attributes: string;
  selected?: IOperator;
}

export const RatingService = {
  async row(rowId: string): Promise<IRating> {
    try {
      return await tables.getRow<IRating>({
        databaseId: DATABASE_ID,
        tableId: TABLE_SKILL_RATINGS,
        rowId,
      });
    } catch (error) {
      console.error("Erro ao buscar arsenal:", error);
      return {} as IRating;
    }
  },
  async list(): Promise<IRating[]> {
    try {
      const response = await tables.listRows<IRating>({
        databaseId: DATABASE_ID,
        tableId: TABLE_SKILL_RATINGS,
        queries: [Query.orderDesc("$createdAt")],
      });

      return response.rows;
    } catch (error) {
      console.error("Erro ao buscar arsenais:", error);
      return [];
    }
  },
  async create(data: IRating, rowId: string): Promise<IRating> {
    return await tables.createRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_SKILL_RATINGS,
      rowId,
      data,
    });
  },
  async update(rowId: string, data: IRating): Promise<IRating> {
    return await tables.updateRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_SKILL_RATINGS,
      rowId,
      data,
    });
  },
  async upsert(
    rowId: string | undefined,
    data: Partial<IRating>
  ): Promise<IRating> {
    try {
      const id = rowId || ID.unique();

      return await tables.upsertRow({
        databaseId: DATABASE_ID,
        tableId: TABLE_SKILL_RATINGS,
        rowId: id,
        data,
      });
    } catch (error) {
      console.error("Erro no upsert:", error);
      throw error;
    }
  },
  async delete(rowId: string): Promise<{}> {
    return await tables.deleteRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_SKILL_RATINGS,
      rowId,
    });
  },
  async getRatingsForTarget(
    targetId: string
  ): Promise<{ rows: IRating[]; total: number }> {
    try {
      return await tables.listRows<IRating>({
        databaseId: DATABASE_ID,
        tableId: TABLE_SKILL_RATINGS,
        queries: [Query.equal("target", targetId)],
      });
    } catch (error) {
      console.error("Erro ao buscar arsenais:", error);
      return { rows: [], total: 0 };
    }
  },
  async getRatingsForVoter(voterId: string): Promise<IRating[]> {
    try {
      const response = await tables.listRows<IRating>({
        databaseId: DATABASE_ID,
        tableId: TABLE_SKILL_RATINGS,
        queries: [
          Query.select(["*", "voter.*", "target.*"]),
          Query.equal("voter", voterId),
        ],
      });

      return response.rows;
    } catch (error) {
      console.error("Erro ao buscar arsenais:", error);
      return [];
    }
  },
  getTierByScore(score: number): {
    label: string;
    color: string;
    icon: string;
  } {
    if (score >= 4.5)
      return { label: "ELITE", color: "#a855f7", icon: "pi pi-crown" };
    if (score >= 3.5)
      return { label: "VETERANO", color: "#f59e0b", icon: "pi pi-shield" };
    if (score >= 2.0)
      return { label: "OPERACIONAL", color: "#3b82f6", icon: "pi pi-cog" };
    return { label: "EM TREINAMENTO", color: "#22c55e", icon: "pi pi-user" };
  },
};
