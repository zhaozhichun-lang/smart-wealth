import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import { getCurrentUser, isGuest } from "@/lib/auth_utils";
import { ensureGuestDataFresh } from "@/lib/guest";
import { eq, and, gte, lte } from "drizzle-orm";

/** 获取当月第一天和最后一天的日期字符串 */
function getCurrentMonthRange() {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  return { firstDay: fmt(first), lastDay: fmt(last) };
}

/** 获取上个月的日期范围 */
function getLastMonthRange() {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const last = new Date(now.getFullYear(), now.getMonth(), 0);
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  return { firstDay: fmt(first), lastDay: fmt(last) };
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json(
      { message: "未登录或 token 已过期" },
      { status: 401 },
    );
  }

  // 游客数据每日新鲜度检查
  if (isGuest(user)) {
    await ensureGuestDataFresh(user.id);
  }

  try {
    // 查询当前用户所有交易
    const allTx = await db
      .select()
      .from(transactions)
      .where(eq(transactions.user_id, user.id));

    // ===== 月度汇总 =====
    const monthlyMap: Record<
      string,
      { income: number; expense: number; count: number }
    > = {};

    for (const tx of allTx) {
      const month = tx.date?.slice(0, 7) || "未知";
      if (!monthlyMap[month]) {
        monthlyMap[month] = { income: 0, expense: 0, count: 0 };
      }
      const amt = Number(tx.amount) || 0;
      if (tx.type === "income") {
        monthlyMap[month].income += amt;
      } else {
        monthlyMap[month].expense += amt;
      }
      monthlyMap[month].count += 1;
    }

    const monthlySummary = Object.entries(monthlyMap)
      .map(([month, val]) => ({
        month,
        income: Math.round(val.income * 100) / 100,
        expense: Math.round(val.expense * 100) / 100,
        balance: Math.round((val.income - val.expense) * 100) / 100,
        count: val.count,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // ===== 当月 vs 上月对比 =====
    const { firstDay, lastDay } = getCurrentMonthRange();
    const { firstDay: lastFirst, lastDay: lastLast } = getLastMonthRange();

    const thisMonthTx = allTx.filter(
      (tx) => tx.date! >= firstDay && tx.date! <= lastDay,
    );
    const lastMonthTx = allTx.filter(
      (tx) => tx.date! >= lastFirst && tx.date! <= lastLast,
    );

    const sum = (list: typeof allTx, type: "income" | "expense") =>
      list
        .filter((t) => t.type === type)
        .reduce((s, t) => s + Number(t.amount || 0), 0);

    const thisIncome = sum(thisMonthTx, "income");
    const thisExpense = sum(thisMonthTx, "expense");
    const lastIncome = sum(lastMonthTx, "income");
    const lastExpense = sum(lastMonthTx, "expense");

    const expenseChange =
      lastExpense === 0
        ? null
        : Math.round(((thisExpense - lastExpense) / lastExpense) * 100 * 100) /
          100;

    // ===== 当月支出分类汇总 =====
    const categoryMap: Record<string, number> = {};
    for (const tx of thisMonthTx) {
      if (tx.type !== "expense") continue;
      const cat = tx.category || "未分类";
      categoryMap[cat] = (categoryMap[cat] || 0) + Number(tx.amount || 0);
    }

    const categoryBreakdown = Object.entries(categoryMap)
      .map(([name, value]) => ({
        name,
        value: Math.round(value * 100) / 100,
        percent:
          thisExpense === 0
            ? 0
            : Math.round((value / thisExpense) * 100 * 100) / 100,
      }))
      .sort((a, b) => b.value - a.value);

    // ===== 日均支出 =====
    const daysInMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      0,
    ).getDate();
    const avgDaily =
      Math.round((thisExpense / daysInMonth) * 100) / 100;

    // ===== 历史最高/最低支出月 =====
    const expenseMonths = monthlySummary.filter((m) => m.expense > 0);
    const highestMonth =
      expenseMonths.length > 0
        ? expenseMonths.reduce((max, m) => (m.expense > max.expense ? m : max))
        : null;
    const lowestMonth =
      expenseMonths.length > 0
        ? expenseMonths.reduce((min, m) => (m.expense < min.expense ? m : min))
        : null;

    return NextResponse.json({
      monthlySummary,        // 月度收支汇总
      thisMonth: {
        income: Math.round(thisIncome * 100) / 100,
        expense: Math.round(thisExpense * 100) / 100,
        balance: Math.round((thisIncome - thisExpense) * 100) / 100,
        count: thisMonthTx.length,
      },
      lastMonth: {
        income: Math.round(lastIncome * 100) / 100,
        expense: Math.round(lastExpense * 100) / 100,
        balance: Math.round((lastIncome - lastExpense) * 100) / 100,
        count: lastMonthTx.length,
      },
      expenseChange,         // 环比变化百分比
      categoryBreakdown,     // 当月支出分类
      avgDaily,              // 日均支出
      highestMonth,          // 历史最高支出月
      lowestMonth,           // 历史最低支出月
      daysInMonth,           // 当月天数
    });
  } catch (error) {
    console.error("预算分析失败:", error);
    return NextResponse.json(
      { message: "预算分析失败" },
      { status: 500 },
    );
  }
}
