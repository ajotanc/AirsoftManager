import { tables, DATABASE_ID } from "@/services/appwrite";
import { ID, Query, type Models } from "appwrite";
import type { IOperator } from "./operator";

export const TABLE_VEHICLES = "vehicles";

export interface IVehicle extends Models.Row {
  driver: string;
  type: 'car' | 'motorcycle';
  brand: string;
  model: string;
  color?: string;
  total_seats: number;
  selected?: IOperator;
}

export const VehicleService = {
  async listByOperator(operatorId: string): Promise<IVehicle[]> {
    try {
      const response = await tables.listRows<IVehicle>({
        databaseId: DATABASE_ID,
        tableId: TABLE_VEHICLES,
        queries: [Query.equal("driver", operatorId)],
      });
      return response.rows;
    } catch (error) {
      console.error("Erro ao listar veículos:", error);
      return [];
    }
  },
  async upsert(rowId: string | undefined, data: Partial<IVehicle>): Promise<IVehicle> {
    const id = rowId || ID.unique();

    return await tables.upsertRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_VEHICLES,
      rowId: id,
      data
    });
  },
  async delete(rowId: string): Promise<{}> {
    return await tables.deleteRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_VEHICLES,
      rowId,
    });
  }
};