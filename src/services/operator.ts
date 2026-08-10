import { tables, TABLE_OPERATORS, DATABASE_ID, realtime } from "@/services/appwrite";
import dayjs from "dayjs";
import { isValidCpf } from "@brazilian-utils/brazilian-utils";
import { Query, type Models } from "appwrite";
import type { IArsenal } from "./arsenal";
import type { ILoadout } from "./loadout";
import { deleteFile, formatDate, uploadFile, zRequired } from "@/functions/utils";
import type { ISchoolAnswer } from "./school";
import z from "zod";
import type { IPayment } from "./payment";

export interface IOperator extends Models.Row {
  name: string;
  codename: string;
  identity?: string;
  general_registration?: string;
  blood_type?: string;
  birth_date: Date | string | null;
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
  category?: number;
  experience?: number;
  instagram?: string;
  shirt_size?: string;
  referral_source?: number;
  number_fdba?: string;
  role: string;
  avatar: string;
  status: boolean;
  rating: number;
  media_consent?: boolean;
  terms_accepted?: boolean;
  terms_accepted_at?: Date;
  quote?: string;
  xp: number;
  level: number;
  prestige: number;
  is_donor?: boolean;
  arsenal: IArsenal[];
  loadout: ILoadout[];
  badges: string[];
  featured_badges: string[];
  profession?: string;
  availability?: "saturday" | "sunday" | "both" | "none";
  team?: string;
  courses?: string[];
  school_answers?: ISchoolAnswer[];
  is_online?: boolean;
  last_seen?: string;
  latitude?: number;
  longitude?: number;
  heading?: number;
  payments?: IPayment[];
}

export type IOperatorDraft = Omit<IOperator, keyof Models.Row> & {
  $id: string;
};

interface IRealtimeRowEvent {
  events: string[];
  payload: IOperator;
}

interface IRealtimeSubscription {
  close: () => void;
}

export const operatorSchema = z
  .object({
    name: zRequired("Nome completo obrigatório"),
    codename: zRequired("Codinome obrigatório"),
    identity: zRequired("CPF obrigatório")
      .refine((v: string) => isValidCpf(v), "CPF inválido")
      .transform((v: string) => v.replace(/\D/g, "")),
    general_registration: zRequired("RG obrigatório")
      .transform((v: string) => v.replace(/\D/g, "")),
    birth_date: z
      .custom()
      .refine(
        (date: unknown) => date instanceof Date || typeof date === "string",
        "Data obrigatória",
      )
      .transform((date: unknown) => date && formatDate(date as string | Date).toISOString()),
    blood_type: zRequired("Tipo sanguíneo obrigatório"),
    mother_name: zRequired("Nome da mãe obrigatório"),
    phone: zRequired("Telefone obrigatório")
      .transform((v: string) => v.replace(/\D/g, "")),
    cep: zRequired("CEP obrigatório", 2)
      .transform((v: string) => v.replace(/\D/g, "")),
    address: zRequired("Endereço obrigatório"),
    address_number: zRequired("Número obrigatório"),
    neighborhood: zRequired("Bairro obrigatório"),
    city: zRequired("Cidade obrigatória"),
    state: zRequired("Estado obrigatório"),
    emergency_contact: zRequired("Nome do Contato obrigatório"),
    emergency_contact_phone: zRequired("Telefone do Contato obrigatório")
      .transform((v: string) => v.replace(/\D/g, "")),
    category: z.number({ error: "Categoria obrigatória" }),
    shirt_size: zRequired("Tamanho obrigatório"),
    terms_accepted: z
      .boolean({ error: "Aceite os termos obrigatório" })
      .refine((v: boolean) => v === true, "Aceite os termos obrigatório"),
    availability: zRequired("Escolha sua disponibilidade"),
    instagram: z
      .string()
      .regex(
        /^(?!.*\.\.)(?!.*\.$)[^\W][\w.]*$/,
        "Formato de usuário inválido (ex: exodoairsoft)",
      )
      .nullish()
      .transform((value: string | null | undefined) => value?.replace("@", "").toLowerCase()),
  })
  .loose();

const ONLINE_STALE_MS = 45000;

export const OperatorService = {
  async row(rowId: string): Promise<IOperator> {
    try {
      return await tables.getRow({
        databaseId: DATABASE_ID,
        tableId: TABLE_OPERATORS,
        rowId,
        queries: [Query.select(["*", "arsenal.*", "loadout.*"])],
      });
    } catch (error) {
      console.error("Erro ao buscar usuário:", error);
      return {} as IOperator;
    }
  },
  async list(): Promise<IOperator[]> {
    try {
      const response = await tables.listRows<IOperator>({
        databaseId: DATABASE_ID,
        tableId: TABLE_OPERATORS,
        queries: [
          Query.select(["*", "arsenal.*", "loadout.*"]),
          Query.orderAsc("codename"),
          Query.limit(1000),
        ],
      });

      return response.rows;
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      return [];
    }
  },
  async listActive(): Promise<IOperator[]> {
    try {
      const response = await tables.listRows<IOperator>({
        databaseId: DATABASE_ID,
        tableId: TABLE_OPERATORS,
        queries: [
          Query.orderAsc("codename"),
          Query.select(["*", "arsenal.*", "loadout.*"]),
          Query.equal("status", true),
          Query.notEqual("role", "visitor"),
          Query.limit(1000),
        ],
      });

      return response.rows;
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      return [];
    }
  },
  async listOnline(): Promise<IOperator[]> {
    try {
      const response = await tables.listRows<IOperator>({
        databaseId: DATABASE_ID,
        tableId: TABLE_OPERATORS,
        queries: [
          Query.orderAsc("codename"),
          Query.equal("status", true),
          Query.equal("is_online", true),
          Query.limit(1000),
        ],
      });

      // Filtra client-side quem não manda heartbeat há muito tempo (sessão morta/travada)
      const now = Date.now();
      return response.rows.filter((op) => {
        if (!op.last_seen) return true; // fallback: sem last_seen, confia no is_online
        const lastSeenMs = new Date(op.last_seen).getTime();
        return now - lastSeenMs <= ONLINE_STALE_MS;
      });
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      return [];
    }
  },
  async setOnlineStatus(rowId: string, isOnline: boolean): Promise<void> {
    try {
      await tables.updateRow({
        databaseId: DATABASE_ID,
        tableId: TABLE_OPERATORS,
        rowId,
        data: {
          is_online: isOnline,
          last_seen: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Erro ao atualizar status online:", error);
    }
  },
  async heartbeat(rowId: string): Promise<void> {
    try {
      await tables.updateRow({
        databaseId: DATABASE_ID,
        tableId: TABLE_OPERATORS,
        rowId,
        data: {
          last_seen: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Erro ao enviar heartbeat:", error);
    }
  },
  subscribeOnlineChanges(callback: (payload: IOperator, event: string) => void): () => void {
    let subscription: IRealtimeSubscription | null = null;
    let isCancelled = false;

    realtime
      .subscribe(
        `databases.${DATABASE_ID}.tables.${TABLE_OPERATORS}.rows`,
        (response: IRealtimeRowEvent) => {
          const events = response.events || [];
          const isRelevant = events.some(
            (e: string) =>
              e.endsWith(".update") ||
              e.endsWith(".create") ||
              e.endsWith(".delete")
          );
          if (!isRelevant) return;

          const event = events[events.length - 1] || "";
          callback(response.payload, event);
        }
      )
      .then((sub: IRealtimeSubscription) => {
        if (isCancelled) {
          sub.close();
          return;
        }
        subscription = sub;
      })
      .catch((error: unknown) => {
        console.error("Erro ao inscrever-se em mudanças de operadores:", error);
      });

    return () => {
      isCancelled = true;
      if (subscription) {
        subscription.close();
      }
    };
  },
  async update(rowId: string, data: Partial<IOperator>): Promise<IOperator> {
    return await tables.updateRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_OPERATORS,
      rowId,
      data,
    });
  },
  async create(data: IOperator, rowId: string): Promise<IOperator> {
    return await tables.createRow<IOperator>({
      databaseId: DATABASE_ID,
      tableId: TABLE_OPERATORS,
      rowId,
      data,
    });
  },
  async changeAvatar(
    operator: IOperator,
    file: File,
  ): Promise<IOperator> {
    if (operator.avatar) {
      await deleteFile(operator.$id, "avatar");
    }

    const urlFormatted = await uploadFile(operator.$id, file, "avatar");

    return await tables.updateRow<IOperator>({
      databaseId: DATABASE_ID,
      tableId: TABLE_OPERATORS,
      rowId: operator.$id,
      data: {
        avatar: urlFormatted,
      },
    });
  },
  async listBirthdays(includeNextMonth: boolean = false): Promise<IOperator[]> {
    try {
      const response = await tables.listRows<IOperator>({
        databaseId: DATABASE_ID,
        tableId: TABLE_OPERATORS,
        queries: [
          Query.equal("status", true),
          Query.notEqual("role", "visitor"),
          Query.limit(1000)
        ],
      });

      const now = dayjs();
      const currentMonth = now.month();
      const nextMonth = now.add(1, "month").month();

      const filtered = response.rows.filter((operator) => {
        if (!operator.birth_date) return false;

        const birthDate = dayjs(operator.birth_date);
        const birthMonth = birthDate.month();

        if (includeNextMonth) {
          return birthMonth === currentMonth || birthMonth === nextMonth;
        }

        return birthMonth === currentMonth;
      });

      return filtered.sort((a, b) => {
        const dayA = dayjs(a.birth_date).date();
        const dayB = dayjs(b.birth_date).date();

        const monthA = dayjs(a.birth_date).month();
        const monthB = dayjs(b.birth_date).month();

        if (monthA !== monthB) return monthA - monthB;
        return dayA - dayB;
      });
    } catch (error) {
      console.error("Erro ao buscar aniversariantes:", error);
      return [];
    }
  },
  async getByUsername(username: string): Promise<IOperator> {
    try {
      const response = await tables.listRows<IOperator>({
        databaseId: DATABASE_ID,
        tableId: TABLE_OPERATORS,
        queries: [
          Query.or([
            Query.equal("instagram", username),
            Query.equal("$id", username),
          ]),
        ],
      });

      return response.total === 1
        ? (response.rows[0] as IOperator)
        : ({} as IOperator);
    } catch (error) {
      console.error("Erro ao buscar usuário:", error);
      return {} as IOperator;
    }
  },
  async activate(rowId: string): Promise<IOperator> {
    return await tables.updateRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_OPERATORS,
      rowId,
      data: {
        status: true,
        role: "operator",
      },
    });
  },
};