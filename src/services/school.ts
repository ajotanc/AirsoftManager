import { ID, Query, type Models } from "appwrite";
import { tables, permissions, DATABASE_ID } from "@/services/appwrite";
import dayjs from "dayjs";
import type { IOperator } from "./operator";

export const TABLE_SCHOOL_QUESTIONS = "school_questions";
export const TABLE_SCHOOL_ANSWERS = "school_answers";

export type SchoolCategory = 'rescom' | 'fta' | 'sar';
export const SCHOOL_CATEGORIES = ['fta', 'sar', 'rescom'] as SchoolCategory[];

export interface ISchoolQuestion extends Models.Row {
  text: string;
  options: string[];
  correct_option: string;
  type: string;
  category: SchoolCategory;
  difficulty: string;
}

export interface ISchoolAnswer<To = string | IOperator, Tq = string | ISchoolQuestion> extends Models.Row {
  category: SchoolCategory;
  answers: string[];
  attempt_number: number;
  operator: To;
  questions: Tq[];
  completed_at: string | Date | null;
  score?: number;
  percentage?: number;
  correct?: number;
}

export interface IReadinessLevel {
  color: 'success' | 'danger' | 'warning' | 'info' | 'secondary';
  message: string;
  force?: boolean;
}

export interface ISemester {
  start: dayjs.Dayjs;
  end: dayjs.Dayjs;
  deadline: dayjs.Dayjs;
  label: string;
  semester: number;
  daysRemaining: number;
  isRecoveryPeriod: boolean;
}

export const SchoolService = {
  getSemesterInfo(): ISemester {
    const now = dayjs();
    const month = now.month();
    const day = now.date();

    const isRecoveryPeriod = day <= 10 && (month === 0 || month === 6);

    const semester = isRecoveryPeriod
      ? (month === 0 ? 2 : 1)
      : (month >= 6 ? 2 : 1);

    const year = (isRecoveryPeriod && month === 0)
      ? now.year() - 1
      : now.year();

    const start = semester === 1 ? dayjs(`${year}-01-01`) : dayjs(`${year}-07-01`);
    const end = semester === 1 ? dayjs(`${year}-06-30`) : dayjs(`${year}-12-31`);
    const deadline = end.subtract(5, 'day');

    return {
      start,
      end,
      deadline,
      label: `${year}.${semester}`,
      semester,
      isRecoveryPeriod,
      daysRemaining: deadline.diff(now, 'day')
    };
  },
  getIReadinessLevel(daysRemaining: number, hasCompletedAll: boolean, isRecoveryPeriod: boolean): IReadinessLevel {
    if (hasCompletedAll) return { color: 'success', message: 'Certificações em Dia' };

    if (isRecoveryPeriod) {
      return {
        color: 'danger',
        message: 'MODO RECUPERAÇÃO: Prazo encerrado. Regularize para liberar o sistema!',
        force: true
      };
    }

    if (daysRemaining < 0) {
      return {
        color: 'danger',
        message: 'ACESSO BLOQUEADO: Prazo de avaliação expirado.',
        force: true
      };
    }

    if (daysRemaining <= 7) return { color: 'danger', message: 'PRAZO CRÍTICO: Sistema trava em ' + (daysRemaining + 1) + ' dias!' };
    if (daysRemaining <= 15) return { color: 'warning', message: 'Atenção: Prazo de certificação terminando.' };

    return { color: 'secondary', message: 'Status Normal' };
  },
  async getAnswer(rowId: string): Promise<ISchoolAnswer> {
    const answer = await tables.getRow<ISchoolAnswer>({
      databaseId: DATABASE_ID,
      tableId: TABLE_SCHOOL_ANSWERS,
      rowId,
      queries: [
        Query.select(["*", "questions.*"]),
      ]
    });

    return this.organizeAnswers(answer);
  },
  async getAnswers(operatorId: string, categories: SchoolCategory[]): Promise<{ latest: ISchoolAnswer[], all: ISchoolAnswer[] }> {
    const { start } = SchoolService.getSemesterInfo();

    const response = await tables.listRows<ISchoolAnswer>({
      databaseId: DATABASE_ID,
      tableId: TABLE_SCHOOL_ANSWERS,
      queries: [
        Query.select(["*", "questions.*"]),
        Query.equal("operator", operatorId),
        Query.equal("category", categories),
        Query.greaterThanEqual("completed_at", start.toISOString()),
        Query.orderAsc("completed_at")
      ]
    });

    return {
      latest: this.getLastAnswers(response.rows),
      all: response.rows.map(row => this.organizeAnswers(row))
    };
  },
  getLastAnswers(answers: ISchoolAnswer[]): ISchoolAnswer[] {
    const latestMap = new Map<SchoolCategory, ISchoolAnswer>();

    for (const row of answers) {
      const aligned = this.organizeAnswers(row) as ISchoolAnswer;
      latestMap.set(aligned.category, aligned);
    }

    return Array.from(latestMap.values());
  },
  async getRandomQuestions(category: 'rescom' | 'fta' | 'sar', limit = 10): Promise<ISchoolQuestion[]> {
    const response = await tables.listRows<ISchoolQuestion>({
      databaseId: DATABASE_ID,
      tableId: TABLE_SCHOOL_QUESTIONS,
      queries: [
        Query.equal("category", category),
        Query.limit(10)
      ]
    });

    return this.fisherYates(response.rows).slice(0, limit);
  },
  async getMissingCertifications(operatorId: string): Promise<SchoolCategory[]> {
    const { start } = this.getSemesterInfo();
    const categories: SchoolCategory[] = ['rescom', 'fta', 'sar'];

    const response = await tables.listRows<ISchoolAnswer>({
      databaseId: DATABASE_ID,
      tableId: TABLE_SCHOOL_ANSWERS,
      queries: [
        Query.equal("operator", operatorId),
        Query.greaterThanEqual("completed_at", start.toISOString())
      ]
    });

    const completed = response.rows.map(r => r.category);
    return categories.filter(cat => !completed.includes(cat));
  },
  fisherYates<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = arr[i]!;
      arr[i] = arr[j]!;
      arr[j] = temp;
    }
    return arr;
  },
  async create(data: ISchoolAnswer): Promise<ISchoolAnswer> {
    return await tables.createRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_SCHOOL_ANSWERS,
      rowId: ID.unique(),
      data,
      permissions
    });
  },
  async update(rowId: string, data: Partial<ISchoolAnswer>): Promise<ISchoolAnswer> {
    return await tables.updateRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_SCHOOL_ANSWERS,
      rowId,
      data,
      permissions
    });
  },
  async upsert(
    rowId: string | undefined,
    data: ISchoolAnswer | Partial<ISchoolAnswer>
  ): Promise<ISchoolAnswer> {
    try {
      const isUpdate = !!rowId;

      if (isUpdate) {
        return this.update(rowId, data as Partial<ISchoolAnswer>);
      }

      return this.create(data as ISchoolAnswer);
    } catch (error) {
      console.error("Erro no upsert:", error);
      throw error;
    }
  },
  organizeAnswers(data: ISchoolAnswer): ISchoolAnswer {
    const questions = data.questions as ISchoolQuestion[];
    const answers = data.answers as string[];

    const orderedQuestions = answers.map(ans => questions.find(q => q.options.includes(ans))!);
    const updatedData = { ...data, questions: orderedQuestions };

    const { correct, score, percentage } = this.calculateScore(updatedData);

    return {
      ...updatedData,
      correct,
      score,
      percentage
    };
  },
  calculateScore(answerRow?: ISchoolAnswer): { correct: number, score: number, percentage: number } {
    if (!answerRow?.questions?.length) {
      return {
        correct: 0,
        score: 0,
        percentage: 0
      }
    };

    const questions = answerRow.questions as ISchoolQuestion[];
    const correct = questions.reduce((acc, q, i) =>
      acc + (answerRow.answers[i] === q.correct_option ? 1 : 0), 0);

    const percentage = Math.round((correct / questions.length) * 100);
    const score = percentage / 10;

    return {
      correct,
      score,
      percentage
    };
  }
};