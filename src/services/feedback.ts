import { ID, type Models } from "appwrite";
import { tables, permissions, DATABASE_ID } from "@/services/appwrite";
import type { IOperator } from "./operator";
import type { IEvent } from "./event";

export const TABLE_FEEDBACKS = "feedbacks";

export interface IFeedback<Op = string | IOperator, Ev = string | IEvent> extends Models.Row {
  comment: string;
  stars: number;
  likes: string[];
  operator: Op;
  event: Ev;
}

export const FeedbackService = {
  async create(data: IFeedback): Promise<IFeedback> {
    return await tables.createRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_FEEDBACKS,
      rowId: ID.unique(),
      data,
      permissions
    });
  },
  async upsert(
    rowId: string | undefined,
    data: IFeedback,
  ): Promise<IFeedback> {
    try {
      const id = rowId || ID.unique();

      return await tables.upsertRow({
        databaseId: DATABASE_ID,
        tableId: TABLE_FEEDBACKS,
        rowId: id,
        data,
        permissions
      });
    } catch (error) {
      console.error("Erro no upsert:", error);
      throw error;
    }
  },
  async toggleLike(rowId: string, operatorId: string, currentLikes: string[]) {
    const newLikes = currentLikes.includes(operatorId)
      ? currentLikes.filter(id => id !== operatorId)
      : [...currentLikes, operatorId];

    return await tables.updateRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_FEEDBACKS,
      rowId,
      data: { likes: newLikes }
    });
  },
  async delete(rowId: string): Promise<{}> {
    return await tables.deleteRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_FEEDBACKS,
      rowId,
    });
  },
};