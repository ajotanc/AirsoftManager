import {
  tables,
  TABLE_OPERATORS,
  DATABASE_ID,
  BUCKET_ID,
  storage,
} from "@/services/appwrite";
import { Query } from "appwrite";
import type { Arsenal } from "./arsenal";
import type { Loadout } from "./loadout";

export interface Operator {
  $id: string;
  codename: string;
  identity?: string;
  general_registration?: string;
  blood_type?: string;
  birth_date?: Date;
  mother_name?: string;
  father_name?: string;
  phone?: string;
  cep?: string;
  address?: string;
  address_number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  health_plan?: boolean;
  health_plan_name?: string;
  health_plan_number?: string;
  emergency_contact?: string;
  emergency_contact_phone?: string;
  allergies?: Array<string>;
  continuous_medication?: boolean;
  medication_details?: Array<string>;
  specialty?: number;
  experience?: number;
  instagram?: string;
  shirt_size?: string;
  referral_source?: number;
  number_fdba?: string;
  role: string;
  avatar?: string;
  status: boolean;
  rating: number;
  media_consent?: boolean;
  terms_accepted?: boolean;
  terms_accepted_at?: Date;
  quote?: string;
  arsenal: Arsenal[];
  loadout: Loadout[];
}

export const OperatorService = {
  async row(rowId: string) {
    try {
      return await tables.getRow({
        databaseId: DATABASE_ID,
        tableId: TABLE_OPERATORS,
        rowId,
        queries: [
          Query.select(["*", "arsenal.*", "loadout.*"]),
        ],
      });
    } catch (error) {
      console.error("Erro ao buscar usuário:", error);
      return [];
    }
  },
  async list() {
    try {
      const response = await tables.listRows({
        databaseId: DATABASE_ID,
        tableId: TABLE_OPERATORS,
        queries: [
          Query.select(["*", "arsenal.*", "loadout.*"]),
          Query.orderDesc("$createdAt"),
        ],
      });

      return response.rows;
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      return [];
    }
  },
  async update(rowId: string, data: Operator) {
    return await tables.updateRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_OPERATORS,
      rowId,
      data,
    });
  },
  async create(data: Operator, rowId: string) {
    return await tables.createRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_OPERATORS,
      rowId,
      data,
    });
  },
  async changeAvatar(rowId: string, file: File) {
    const fileId = `avatar-${rowId}`;

    await storage.deleteFile({ bucketId: BUCKET_ID, fileId });
    await storage.createFile({ bucketId: BUCKET_ID, fileId, file });

    const originalUrl = storage.getFileView({ bucketId: BUCKET_ID, fileId });
    const avatar = `${originalUrl}&v=${Date.now()}`;

    return await tables.updateRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_OPERATORS,
      rowId,
      data: {
        avatar,
      },
    });
  },
};
