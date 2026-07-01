import request from "./request";

export interface MonthlySummary {
  month: string;
  income: number;
  expense: number;
  balance: number;
  count: number;
}

export interface MonthData {
  income: number;
  expense: number;
  balance: number;
  count: number;
}

export interface CategoryItem {
  name: string;
  value: number;
  percent: number;
}

export interface BudgetAnalysis {
  monthlySummary: MonthlySummary[];
  thisMonth: MonthData;
  lastMonth: MonthData;
  expenseChange: number | null;
  categoryBreakdown: CategoryItem[];
  avgDaily: number;
  highestMonth: { month: string; income: number; expense: number; balance: number; count: number } | null;
  lowestMonth: { month: string; income: number; expense: number; balance: number; count: number } | null;
  daysInMonth: number;
}

export const budgetApi = {
  /** 获取预算分析数据 */
  analyze: async (): Promise<BudgetAnalysis> => {
    return request.get("/api/budgets");
  },
};
