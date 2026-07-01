import { eq, and, sql } from "drizzle-orm";
import { db } from "@/db";
import { users, transactions, goals } from "@/db/schema";
import { createToken } from "@/lib/jwt";
import { hashPassword } from "@/lib/password";
import { generateRandomString } from "@/lib/utils";

// ==================== 常量 ====================

export const GUEST_EMAIL = "test_guest@smart-wealth.local";
export const GUEST_NAME = "游客体验";

// ==================== 游客用户管理 ====================

/** 获取或创建 test_guest 用户，返回用户 id */
export async function getOrCreateGuestUser(): Promise<number> {
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, GUEST_EMAIL));

  if (existing) return existing.id;

  // 创建游客用户（随机密码，永不使用）
  const randomPwd = generateRandomString(32);
  const hashed = await hashPassword(randomPwd);

  const [created] = await db
    .insert(users)
    .values({
      email: GUEST_EMAIL,
      name: GUEST_NAME,
      password: hashed,
    })
    .returning({ id: users.id });

  // 首次创建时直接 seed 演示数据
  await seedDemoData(created.id);

  return created.id;
}

/** 签发游客 JWT */
export async function createGuestToken(): Promise<string> {
  return createToken({ sub: GUEST_EMAIL });
}

/** 判断用户是否为游客 */
export function isGuestUser(user: { email: string } | null): boolean {
  return user?.email === GUEST_EMAIL;
}

// ==================== 演示数据 ====================

/** 插入标准演示数据 */
export async function seedDemoData(userId: number): Promise<void> {
  const today = new Date();

  // 日期辅助：daysAgo 天前
  const daysAgo = (n: number): string => {
    const d = new Date(today);
    d.setDate(d.getDate() - n);
    return d.toISOString().split("T")[0];
  };

  const demoTx = [
    { type: "income", category: "工资", amount: "15000.00", date: daysAgo(5), description: "月薪收入", source: "公司" },
    { type: "expense", category: "餐饮", amount: "45.00", date: daysAgo(4), description: "午餐外卖", source: null },
    { type: "expense", category: "交通", amount: "200.00", date: daysAgo(3), description: "地铁充值", source: null },
    { type: "expense", category: "购物", amount: "899.00", date: daysAgo(2), description: "无线耳机", source: "京东" },
    { type: "expense", category: "餐饮", amount: "128.00", date: daysAgo(1), description: "周末聚餐", source: null },
    { type: "expense", category: "娱乐", amount: "59.00", date: daysAgo(0), description: "电影票", source: "淘票票" },
  ];

  for (const tx of demoTx) {
    await db.insert(transactions).values({
      user_id: userId,
      type: tx.type as "income" | "expense",
      category: tx.category,
      amount: tx.amount,
      date: tx.date,
      description: tx.description,
      source: tx.source,
    });
  }

  // 一个储蓄目标
  const deadline = new Date("2026-12-31").toISOString().split("T")[0];
  await db.insert(goals).values({
    user_id: userId,
    title: "存钱买MacBook Pro",
    target_amount: "15000.00",
    current_amount: "3500.00",
    deadline,
  });
}

// ==================== 数据每日重置 ====================

/** 如果游客数据不是今天的，则重置并重新 seed */
export async function ensureGuestDataFresh(userId: number): Promise<void> {
  const [guestUser] = await db
    .select({ last_reset_at: users.last_reset_at })
    .from(users)
    .where(eq(users.id, userId));

  if (!guestUser) return;

  const lastReset = guestUser.last_reset_at;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 检查是否已有交易数据，没有则强制 seed（处理已有用户升级等边缘情况）
  const [txCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(transactions)
    .where(eq(transactions.user_id, userId));
  const hasData = (txCount?.count ?? 0) > 0;

  // 如果 last_reset_at 已经是今天且有数据，无需重置
  if (hasData && lastReset) {
    const lastDate = new Date(lastReset);
    lastDate.setHours(0, 0, 0, 0);
    if (lastDate.getTime() === today.getTime()) return;
  }

  // 在事务中执行重置
  await db.transaction(async (tx) => {
    // 删除游客旧数据
    await tx.delete(transactions).where(eq(transactions.user_id, userId));
    await tx.delete(goals).where(eq(goals.user_id, userId));

    // 重新 seed
    const today = new Date();
    const daysAgo = (n: number): string => {
      const d = new Date(today);
      d.setDate(d.getDate() - n);
      return d.toISOString().split("T")[0];
    };

    const demoTx = [
      { type: "income", category: "工资", amount: "15000.00", date: daysAgo(5), description: "月薪收入", source: "公司" },
      { type: "expense", category: "餐饮", amount: "45.00", date: daysAgo(4), description: "午餐外卖", source: null },
      { type: "expense", category: "交通", amount: "200.00", date: daysAgo(3), description: "地铁充值", source: null },
      { type: "expense", category: "购物", amount: "899.00", date: daysAgo(2), description: "无线耳机", source: "京东" },
      { type: "expense", category: "餐饮", amount: "128.00", date: daysAgo(1), description: "周末聚餐", source: null },
      { type: "expense", category: "娱乐", amount: "59.00", date: daysAgo(0), description: "电影票", source: "淘票票" },
    ];

    for (const demo of demoTx) {
      await tx.insert(transactions).values({
        user_id: userId,
        type: demo.type as "income" | "expense",
        category: demo.category,
        amount: demo.amount,
        date: demo.date,
        description: demo.description,
        source: demo.source,
      });
    }

    const deadline = new Date("2026-12-31").toISOString().split("T")[0];
    await tx.insert(goals).values({
      user_id: userId,
      title: "存钱买MacBook Pro",
      target_amount: "15000.00",
      current_amount: "3500.00",
      deadline,
    });

    // 更新重置时间
    await tx
      .update(users)
      .set({ last_reset_at: new Date() })
      .where(eq(users.id, userId));
  });
}

// ==================== AI 频率限制 ====================

interface RateEntry {
  minuteStart: number;
  minuteCount: number;
  dayStart: string;
  dayCount: number;
}

const rateLimitMap = new Map<number, RateEntry>();

const LIMIT_PER_MINUTE = 3;
const LIMIT_PER_DAY = 20;
export const RATE_LIMIT_MESSAGE = "游客体验次数已达上限，请稍后再试";

/** 检查游客 AI 调用频率限制 */
export function checkGuestRateLimit(
  userId: number,
): { allowed: boolean; message?: string } {
  const now = Date.now();
  const today = new Date().toISOString().split("T")[0];

  let entry = rateLimitMap.get(userId);

  // 新的一天，重置计数器
  if (!entry || entry.dayStart !== today) {
    entry = {
      minuteStart: now,
      minuteCount: 0,
      dayStart: today,
      dayCount: 0,
    };
    rateLimitMap.set(userId, entry);
  }

  // 新的分钟窗口
  if (now - entry.minuteStart > 60_000) {
    entry.minuteStart = now;
    entry.minuteCount = 0;
  }

  if (entry.minuteCount >= LIMIT_PER_MINUTE) {
    return { allowed: false, message: RATE_LIMIT_MESSAGE };
  }
  if (entry.dayCount >= LIMIT_PER_DAY) {
    return { allowed: false, message: RATE_LIMIT_MESSAGE };
  }

  entry.minuteCount++;
  entry.dayCount++;
  return { allowed: true };
}
