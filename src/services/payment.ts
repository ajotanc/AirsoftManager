import { QrCodePix } from 'qrcode-pix';
import { ID, Query, type Models } from "appwrite";
import { tables, DATABASE_ID } from "@/services/appwrite";
import { TEAM_NAME } from '@/constants/airsoft';
import { uploadFile } from '@/functions/utils';
import type { IOperator } from './operator';
import { CashflowService, type ICashflow } from './cashflow';
import dayjs from 'dayjs';
import { GoalService, type IGoal } from './goal';
import { BadgeService } from './badge';
import { useOperator } from '@/composables/useOperator';

export const TABLE_PAYMENTS = "payments";
const key = import.meta.env.VITE_PIX_KEY;

export interface IPayment extends Models.Row {
  description: string;
  amount: number;
  status: 'created' | 'pending' | 'overdue' | 'paid';
  category: string;
  reference: string;
  receipt_url: string | null;
  goal?: string | IGoal;
  operator: string | IOperator;
  due_date: Date | string | null;
}

export const PaymentService = {
  async list(): Promise<IPayment[]> {
    const reference = dayjs().format("MM/YYYY");

    try {
      const response = await tables.listRows<IPayment>({
        databaseId: DATABASE_ID,
        tableId: TABLE_PAYMENTS,
        queries: [
          Query.select(["*", "operator.*"]),
          Query.orderAsc("reference"),
          Query.equal("reference", reference),
        ],
      });

      return response.rows;
    } catch (error) {
      console.error("Erro ao listar visitantes:", error);
      return [];
    }
  },
  async listByOperator(operatorId: string): Promise<IPayment[]> {
    const reference = dayjs().format("MM/YYYY");

    try {
      const response = await tables.listRows<IPayment>({
        databaseId: DATABASE_ID,
        tableId: TABLE_PAYMENTS,
        queries: [
          Query.select(["*", "operator.*"]),
          Query.orderAsc("reference"),
          Query.equal("operator", operatorId),
          Query.equal("reference", reference),
        ],
      });

      return response.rows;
    } catch (error) {
      console.error("Erro ao listar visitantes:", error);
      return [];
    }
  },
  async create(data: IPayment): Promise<IPayment> {
    return await tables.createRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_PAYMENTS,
      rowId: ID.unique(),
      data,
    });
  },
  async upsert(
    rowId: string | undefined,
    data: Partial<IPayment>
  ): Promise<IPayment> {
    try {
      const id = rowId || ID.unique();

      return await tables.upsertRow({
        databaseId: DATABASE_ID,
        tableId: TABLE_PAYMENTS,
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
      tableId: TABLE_PAYMENTS,
      rowId,
    });
  },
  async generatePix(value: number, message: string, transactionId: string): Promise<{ payload: string; base64: string }> {
    const qrCodePix = QrCodePix({
      version: '01',
      key,
      name: TEAM_NAME,
      city: 'SALVADOR',
      transactionId,
      message,
      value,
    });

    return {
      payload: qrCodePix.payload(),
      base64: await qrCodePix.base64(),
    };
  },
  async payment(rowId: string, file: File): Promise<IPayment> {
    try {
      const urlFormatted = await uploadFile(rowId, file, 'payment-receipt');

      return await tables.updateRow<IPayment>({
        databaseId: DATABASE_ID,
        tableId: TABLE_PAYMENTS,
        rowId,
        data: {
          receipt_url: urlFormatted,
          status: 'pending'
        },
      });
    } catch (error) {
      console.error("Erro no upsert:", error);
      return {} as IPayment;
    }
  },
  async confirmPayment(rowId: string): Promise<IPayment> {
    const { updateState } = useOperator();

    const payment = await tables.updateRow<IPayment>({
      databaseId: DATABASE_ID,
      tableId: TABLE_PAYMENTS,
      rowId,
      data: {
        status: 'paid'
      },
    });

    if (payment.goal) {
      const goal = payment.goal as IGoal;
      await GoalService.update(goal.$id, { current_amount: (goal.current_amount + payment.amount) });
    }

    const date = dayjs();
    const reference = date.format("MM/YYYY");

    const data = {
      description: payment.description,
      amount: payment.amount,
      type: 'income',
      category: payment.category,
      reference,
      date: date.toISOString(),
      receipt_url: payment.receipt_url,
      payment: payment.$id,
    } as ICashflow;

    await CashflowService.create(data);

    const xpAmount = payment.category === 'goal' ? 100 : 50;

    const updatedOp = await BadgeService.addActivityXp(payment.operator as IOperator, xpAmount);
    await updateState(updatedOp);

    return payment;
  },
  async contribute(data: IPayment, file: File): Promise<IPayment> {
    const rowId = ID.unique();
    const urlFormatted = await uploadFile(rowId, file, 'payment-receipt');

    return await tables.createRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_PAYMENTS,
      rowId,
      data: {
        ...data,
        receipt_url: urlFormatted,
      },
    });
  },
};