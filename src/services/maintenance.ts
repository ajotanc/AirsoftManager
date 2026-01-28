import { ID, Query, type Models } from "appwrite";
import { tables, DATABASE_ID } from "@/services/appwrite";
import type { IOperator } from "./operator";
import { ArsenalService, type IArsenal } from "./arsenal";

export const TABLE_MAINTENANCE = "maintenance";

export interface IMaintenance<TOp = string | IOperator, TAr = string | IArsenal> extends Models.Row {
  type: string;
  status: string;
  technical_report: string;
  operator: TOp;
  arsenal: TAr;
  maintenance_at: Date | string | null;
  selected?: IOperator;
}

export const MaintenanceService = {
  async row(rowId: string): Promise<IMaintenance> {
    try {
      return await tables.getRow<IMaintenance>({
        databaseId: DATABASE_ID,
        tableId: TABLE_MAINTENANCE,
        rowId,
      });
    } catch (error) {
      console.error("Erro ao buscar arsenal:", error);
      return {} as IMaintenance;
    }
  },
  async list(): Promise<IMaintenance<IOperator, IArsenal>[]> {
    try {
      const response = await tables.listRows<IMaintenance<IOperator, IArsenal>>({
        databaseId: DATABASE_ID,
        tableId: TABLE_MAINTENANCE,
        queries: [
          Query.orderAsc("maintenance_at"),
          Query.select([
            "*",
            "operator.*",
            "arsenal.*"
          ])
        ],
      });

      return response.rows;
    } catch (error) {
      console.error("Erro ao listar visitantes:", error);
      return [];
    }
  },
  async listByArsenal(arsenalId: string): Promise<IMaintenance<IOperator, IArsenal>[]> {
    try {
      const response = await tables.listRows<IMaintenance<IOperator, IArsenal>>({
        databaseId: DATABASE_ID,
        tableId: TABLE_MAINTENANCE,
        queries: [
          Query.orderDesc("maintenance_at"),
          Query.select([
            "*",
            "operator.*",
            "arsenal.*"
          ]),
          Query.equal("arsenal", arsenalId)
        ],
      });

      return response.rows;
    } catch (error) {
      console.error("Erro ao listar visitantes:", error);
      return [];
    }
  },
  async create(data: IMaintenance): Promise<IMaintenance> {
    return await tables.createRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_MAINTENANCE,
      rowId: ID.unique(),
      data,
    });
  },
  async upsert(
    rowId: string | undefined,
    data: Partial<IMaintenance>
  ): Promise<IMaintenance> {
    try {
      const id = rowId || ID.unique();

      const response = await tables.upsertRow<IMaintenance>({
        databaseId: DATABASE_ID,
        tableId: TABLE_MAINTENANCE,
        rowId: id,
        data,
      });

      if (response.status === 'completed') {
        const arsenal = response.arsenal as IArsenal;
        await ArsenalService.update(arsenal.$id, { maintenance_at: response.maintenance_at })
      }

      return response;
    } catch (error) {
      console.error("Erro no upsert:", error);
      throw error;
    }
  },
  async delete(rowId: string): Promise<{}> {
    return await tables.deleteRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_MAINTENANCE,
      rowId,
    });
  },
};