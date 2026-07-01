// 交易类型定义
export type TransactionType = "income" | "expense";
export type IncomeCategory = "salary" | "transfer" | "part_time" | "other";
export type ExpenseCategory = "food" | "transport" | "entertainment" | "other";
export type TransactionSource = "alipay" | "wechat" | "bank" | "other";

export interface TransactionBase {
  user_id: number;
  type: TransactionType;
  category: string;
  amount: number;
  description?: string | null;
  source?: TransactionSource | null;
  date?: string | null;
}

export interface TransactionCreate extends TransactionBase {}

// Partial ：将接口中的所有属性设置为可选，允许在创建或更新交易时只提供部分属性
export interface TransactionUpdate extends Partial<TransactionBase> {
  id: number;
}

export interface TransactionResponse {
  id: number;
  user_id: number;
  type: TransactionType;
  category: string;
  amount: number;
  description?: string | null;
  source?: string | null;
  date?: string | null;
  create_at: string;
}

// 分类显示名称映射
export const INCOME_CATEGORIES: Record<IncomeCategory, string> = {
  salary: "工资",
  transfer: "转账",
  part_time: "兼职",
  other: "其他",
};

export const EXPENSE_CATEGORIES: Record<ExpenseCategory, string> = {
  food: "餐饮",
  transport: "交通",
  entertainment: "娱乐",
  other: "其他",
};

export const TRANSACTION_SOURCES: Record<TransactionSource, string> = {
  alipay: "支付宝",
  wechat: "微信",
  bank: "银行卡",
  other: "其他",
};

// 获取分类显示名称
export const getCategoryName = (
  type: TransactionType,
  category: string,
): string => {
  if (type === "income") {
    return INCOME_CATEGORIES[category as IncomeCategory] || category;
  }
  return EXPENSE_CATEGORIES[category as ExpenseCategory] || category;
};

// 获取来源显示名称
export const getSourceName = (source?: string | null): string => {
  if (!source) return "未指定";
  return TRANSACTION_SOURCES[source as TransactionSource] || source;
};
