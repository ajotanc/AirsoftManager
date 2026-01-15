import { tables, DATABASE_ID } from "@/services/appwrite";
import { ID, Query, type Models } from "appwrite";
import type { IOperator } from "./operator";
import type { ICarpool } from "./carpool";
import type { IVehicle } from "./vehicle";

export const TABLE_CARPOOL_REQUESTS = "carpool_requests";

export interface ICarpoolRequest<
  Op = string | IOperator,
  Cp = string | ICarpool
> extends Models.Row {
  carpool: Cp;
  requester: Op;
  status: 'pending' | 'accepted' | 'rejected';
}

export const CarpoolRequestService = {
  // Outro operador solicita a vaga
  async create(carpool: string, requester: string): Promise<ICarpoolRequest> {
    return await tables.createRow<ICarpoolRequest>({
      databaseId: DATABASE_ID,
      tableId: TABLE_CARPOOL_REQUESTS,
      rowId: ID.unique(),
      data: {
        carpool,
        requester,
        status: 'pending'
      },
    });
  },
  async listByCarpools(carpoolIds: string[]): Promise<ICarpoolRequest<IOperator, ICarpool<IVehicle>>[]> {
    const response = await tables.listRows<ICarpoolRequest<IOperator, ICarpool<IVehicle>>>({
      databaseId: DATABASE_ID,
      tableId: TABLE_CARPOOL_REQUESTS,
      queries: [
        Query.equal("carpool", carpoolIds),
        Query.select(["*", "requester.*", "carpool.*", "carpool.vehicle.*"])
      ],
    });

    return response.rows;
  },
  async updateStatus(rowId: string, status: 'accepted' | 'rejected'): Promise<ICarpoolRequest<IOperator, ICarpool<IVehicle>>> {
    return await tables.updateRow<ICarpoolRequest<IOperator, ICarpool<IVehicle>>>({
      databaseId: DATABASE_ID,
      tableId: TABLE_CARPOOL_REQUESTS,
      rowId,
      data: { status },
    });
  }
};