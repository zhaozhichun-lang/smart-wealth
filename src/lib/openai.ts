import OpenAI from "openai";
import { db } from "@/db";
import { transactions, goals } from "@/db/schema";
import { and, eq, sql, desc } from "drizzle-orm";
import { env } from "@/lib/env";

let client: OpenAI | null = null;

// 单例模式：确保只创建一个 OpenAI 客户端
export function getOpenAIClient() {
  if (!client) {
    client = new OpenAI({
      apiKey: env.DEEPSEEK_API_KEY,
      baseURL: env.DEEPSEEK_BASE_URL,
    });
  }
  return client;
}

// 构建用户财务上下文
// 用户的总收入 总支出  财务目标
export async function buildUserContext(userId: number) {
  // 用户总收入
  const [incomeResult] = await db
    //  聚合函数
    //  COALESCE 函数，如果 SUM(amount) 为 NULL，返回 0，否则返回 SUM(amount) 的结果
    .select({ total: sql`COALESCE(SUM(amount), 0)` })
    .from(transactions)
    .where(
      and(eq(transactions.user_id, userId), eq(transactions.type, "income")),
    );

  // 用户总支出
  const [expenseResult] = await db
    .select({ total: sql`COALESCE(SUM(amount), 0)` })
    .from(transactions)
    .where(
      and(eq(transactions.user_id, userId), eq(transactions.type, "expense")),
    );

  // incomeResult ： { total: 1000 }
  // expenseResult ： { total: 500 }

  const income = Number(incomeResult?.total || 0);
  const expense = Number(expenseResult?.total || 0);

  // 用户最新财务目标
  const [latestGoal] = await db
    .select()
    .from(goals)
    .where(eq(goals.user_id, userId))
    .orderBy(desc(goals.create_at))
    .limit(1);

  //  构建上下文
  let context = `用户的收入是：${income}，支出是：${expense}。`;
  if (latestGoal) {
    context += `用户的最新财务目标是：${latestGoal.title}，
                 目标金额是：${latestGoal.target_amount}，
                 当前金额是：${latestGoal.current_amount}，
                 截止时间是：${latestGoal.deadline}。`;
  }

  return context;
}
