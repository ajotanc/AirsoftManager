import { ID, Query, type Models } from "appwrite";
import { tables, DATABASE_ID } from "@/services/appwrite";
import type { IOperator } from "./operator";

export const TABLE_SCHEDULES = "schedules";

export interface ISchedule<TOp = string | null | IOperator> extends Models.Row {
  type: 'training' | 'maintenance';
  date: Date | string | null;
  description: string;
  report?: string;
  status: 'scheduled' | 'completed' | 'canceled';
  leader: TOp;
  operators: TOp[];
  attended: string[];
  selected?: IOperator[];
}

export const ScheduleService = {
  async row(rowId: string): Promise<ISchedule> {
    try {
      return await tables.getRow<ISchedule>({
        databaseId: DATABASE_ID,
        tableId: TABLE_SCHEDULES,
        rowId,
      });
    } catch (error) {
      console.error("Erro ao buscar arsenal:", error);
      return {} as ISchedule;
    }
  },
  async list(): Promise<ISchedule<IOperator>[]> {
    const startOfMonth = dayjs().startOf('month').toISOString();
    // const endOfMonth = dayjs().endOf('month').toISOString();

    const response = await tables.listRows<ISchedule<IOperator>>({
      databaseId: DATABASE_ID,
      tableId: TABLE_SCHEDULES,
      queries: [
        // Query.between("date", startOfMonth, endOfMonth),
        Query.greaterThanEqual("date", startOfMonth),
        Query.orderAsc("date"),
        Query.select([
          "*",
          "operators.*",
          "leader.*"
        ])
      ]
    });

    return response.rows;
  },
  async listNext(): Promise<ISchedule<IOperator>[]> {
    const response = await tables.listRows<ISchedule<IOperator>>({
      databaseId: DATABASE_ID,
      tableId: TABLE_SCHEDULES,
      queries: [
        Query.orderAsc("date"),
        Query.select(["*", "leader.*", "operators.*"]),
        Query.greaterThanEqual("date", new Date().toISOString()),
        Query.notEqual("status", "canceled")
      ],
    });

    return response.rows;
  },
  async create(data: ISchedule): Promise<ISchedule> {
    return await tables.createRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_SCHEDULES,
      rowId: ID.unique(),
      data,
    });
  },
  async update(rowId: string, data: Partial<ISchedule>): Promise<ISchedule> {
    return await tables.updateRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_SCHEDULES,
      rowId,
      data,
    });
  },
  async upsert(
    rowId: string | undefined,
    data: ISchedule | Partial<ISchedule>
  ): Promise<ISchedule> {
    try {
      const isUpdate = !!rowId;

      if (isUpdate) {
        return this.update(rowId, data as Partial<ISchedule>);
      }

      return this.create(data as ISchedule);
    } catch (error) {
      console.error("Erro no upsert:", error);
      throw error;
    }
  },
  async delete(rowId: string): Promise<{}> {
    return await tables.deleteRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_SCHEDULES,
      rowId,
    });
  },
  async finalize(rowId: string, data: Partial<ISchedule>): Promise<ISchedule> {
    return await tables.updateRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_SCHEDULES,
      rowId,
      data: {
        ...data,
        status: 'completed'
      }
    });
  }
};