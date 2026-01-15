import { tables, DATABASE_ID } from "@/services/appwrite";
import { ID, Query, type Models } from "appwrite";
import type { IVehicle } from "./vehicle";

export const TABLE_CARPOOLS = "carpools";

export interface ICarpool<Vh = string | IVehicle> extends Models.Row {
  vehicle: Vh;
  event: string;
  available_seats: number;
  departure_point: string;
  departure_time: string;
}

export const CarpoolService = {
  async listByEvent(eventId: string): Promise<ICarpool<IVehicle>[]> {
    try {
      const response = await tables.listRows<ICarpool<IVehicle>>({
        databaseId: DATABASE_ID,
        tableId: TABLE_CARPOOLS,
        queries: [
          Query.equal("event", eventId),
          Query.select(["*", "driver.*", "vehicle.*"]), // Hidrata motorista e veículo
        ],
      });
      return response.rows;
    } catch (error) {
      console.error("Erro ao listar caronas do evento:", error);
      return [];
    }
  },
  async create(data: Partial<ICarpool>): Promise<ICarpool> {
    return await tables.createRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_CARPOOLS,
      rowId: ID.unique(),
      data: data as ICarpool,
    });
  },
  async delete(rowId: string): Promise<{}> {
    return await tables.deleteRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_CARPOOLS,
      rowId,
    });
  },
  async updateSeats(requestId: string, available_seats: number): Promise<ICarpool> {
    return await tables.updateRow<ICarpool>({
      databaseId: DATABASE_ID,
      tableId: TABLE_CARPOOLS,
      rowId: requestId,
      data: { available_seats },
    });
  }
};