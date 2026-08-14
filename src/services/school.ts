import { ID, Query, type Models } from "appwrite";
import { tables, permissions, DATABASE_ID } from "@/services/appwrite";
import dayjs from "dayjs";
import type { IOperator } from "./operator";
import { fisherYatesShuffle } from "@/functions/utils";

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
  getSemesterInfo(targetDate?: string | Date | dayjs.Dayjs | null): ISemester {
    const now = targetDate ? dayjs(targetDate) : dayjs();
    const month = now.month(); // 0-indexed: 0 = Jan, 6 = Jul, 7 = Aug

    const isRecoveryPeriod = (month === 0 || month === 6);

    const semester = isRecoveryPeriod
      ? (month === 0 ? 2 : 1)
      : (month >= 6 ? 2 : 1);

    const year = (isRecoveryPeriod && month === 0)
      ? now.year() - 1
      : now.year();

    // Semester 1 regular period starts Feb 1st; Semester 2 regular period starts Aug 1st
    const start = semester === 1 ? dayjs(`${year}-02-01`) : dayjs(`${year}-08-01`);
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
    const { start, end } = SchoolService.getSemesterInfo();

    const allResponse = await tables.listRows<ISchoolAnswer>({
      databaseId: DATABASE_ID,
      tableId: TABLE_SCHOOL_ANSWERS,
      queries: [
        Query.select(["*", "questions.*"]),
        Query.equal("operator", operatorId),
        Query.equal("category", categories),
        Query.orderDesc("completed_at"),
        Query.limit(1000)
      ]
    });

    const all = allResponse.rows.map(row => this.organizeAnswers(row));

    const currentSemesterAnswers = all.filter(item => {
      if (!item.completed_at) return false;
      const date = dayjs(item.completed_at);
      return (date.isAfter(start.startOf('day')) || date.isSame(start.startOf('day'))) &&
        (date.isBefore(end.endOf('day')) || date.isSame(end.endOf('day')));
    });

    const ascendingCurrent = [...currentSemesterAnswers].reverse();

    return {
      latest: this.getLastAnswers(ascendingCurrent),
      all
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
        Query.limit(100)
      ]
    });

    return fisherYatesShuffle<ISchoolQuestion>(response.rows).slice(0, limit);
  },
  async getRecoveryQuestions(limitPerCategory = 10): Promise<ISchoolQuestion[]> {
    const promises = SCHOOL_CATEGORIES.map(cat => this.getRandomQuestions(cat, limitPerCategory));
    const results = await Promise.all(promises);
    return results.flat();
  },
  getApprovedCategories(answers: ISchoolAnswer[], targetDate?: string | Date | dayjs.Dayjs | null): SchoolCategory[] {
    const { start, end } = this.getSemesterInfo(targetDate);
    const approved = new Set<SchoolCategory>();

    for (const raw of answers) {
      if (!raw.completed_at) continue;
      const date = dayjs(raw.completed_at);
      const inSemester = (date.isAfter(start.startOf('day')) || date.isSame(start.startOf('day'))) &&
        (date.isBefore(end.endOf('day')) || date.isSame(end.endOf('day')));
      if (!inSemester) continue;

      const organized = this.organizeAnswers(raw);
      const isPassed = (organized.percentage ?? 0) >= 70 || (organized.score ?? 0) >= 7;
      if (isPassed) {
        approved.add(organized.category);
      }
    }

    return Array.from(approved);
  },
  getMissingCertificationsFromAnswers(answers: ISchoolAnswer[], targetDate?: string | Date | dayjs.Dayjs | null): SchoolCategory[] {
    const approved = this.getApprovedCategories(answers, targetDate);
    return SCHOOL_CATEGORIES.filter(cat => !approved.includes(cat));
  },
  async getMissingCertifications(operatorId: string): Promise<SchoolCategory[]> {
    const { start, end } = this.getSemesterInfo();

    const response = await tables.listRows<ISchoolAnswer>({
      databaseId: DATABASE_ID,
      tableId: TABLE_SCHOOL_ANSWERS,
      queries: [
        Query.select(["*", "questions.*"]),
        Query.equal("operator", operatorId),
        Query.greaterThanEqual("completed_at", start.startOf('day').toISOString()),
        Query.lessThanEqual("completed_at", end.endOf('day').toISOString())
      ]
    });

    return this.getMissingCertificationsFromAnswers(response.rows);
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
    const questions = (data.questions || []) as any[];
    const answers = (data.answers || []) as string[];

    if (!questions.length || !answers.length) {
      return {
        ...data,
        correct: data.correct ?? 0,
        score: data.score ?? 0,
        percentage: data.percentage ?? 0
      };
    }

    const { correct, score, percentage } = this.calculateScore(data);

    return {
      ...data,
      correct,
      score,
      percentage
    };
  },
  calculateScore(answerRow?: ISchoolAnswer): { correct: number, score: number, percentage: number } {
    if (!answerRow?.answers?.length) {
      return {
        correct: answerRow?.correct ?? 0,
        score: answerRow?.score ?? 0,
        percentage: answerRow?.percentage ?? 0
      };
    }

    const questions = (answerRow.questions || []) as ISchoolQuestion[];
    const answers = (answerRow.answers || []) as string[];

    const hasValidQuestionObjects = Array.isArray(questions) &&
      questions.length > 0 &&
      typeof questions[0] === 'object' &&
      questions[0] !== null &&
      'correct_option' in questions[0];

    if (!hasValidQuestionObjects) {
      const isCompleted = !!answerRow.completed_at;
      return {
        correct: answerRow.correct ?? (isCompleted ? answers.length : 0),
        score: answerRow.score ?? (isCompleted ? 10 : 0),
        percentage: answerRow.percentage ?? (isCompleted ? 100 : 0)
      };
    }

    const calculatedCorrect = questions.reduce((acc, q, i) => {
      if (!q || !q.correct_option) return acc;
      const userAns = answers[i];
      const ans = (userAns && q.options?.includes(userAns) ? userAns : answers.find(a => !!a && q.options?.includes(a))) || userAns;
      return acc + (ans === q.correct_option ? 1 : 0);
    }, 0);

    const total = questions.length || 1;
    const calculatedScore = Number(((calculatedCorrect / total) * 10).toFixed(1));
    const calculatedPercentage = Math.round((calculatedCorrect / total) * 100);

    return {
      correct: answerRow.correct ?? calculatedCorrect,
      score: answerRow.score ?? calculatedScore,
      percentage: answerRow.percentage ?? calculatedPercentage
    };
  }
};