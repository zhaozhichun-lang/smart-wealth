import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import { getCurrentUser, isGuest } from "@/lib/auth_utils";
import { ensureGuestDataFresh } from "@/lib/guest";
import { eq, and, desc } from "drizzle-orm";
import { createTransactionSchema } from "@/lib/validation";
import { parseBody } from "@/lib/api-utils";

// 创建交易
export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json(
      { message: "未登录或 token 已过期" },
      { status: 401 },
    );
  }

  // 游客不允许创建交易
  if (isGuest(user)) {
    return NextResponse.json(
      { message: "游客模式仅支持查看" },
      { status: 403 },
    );
  }

  try {
    const parsed = await parseBody(request, createTransactionSchema);
    if ("errorResponse" in parsed) return parsed.errorResponse;

    const { type, category, amount, description, source, date } = parsed.data;

    const [tx] = await db
      .insert(transactions)
      .values({
        user_id: user.id,
        type,
        category,
        amount: amount.toString(),
        date: date || new Date().toISOString().split("T")[0],
        description: description || null,
        source: source || null,
      })
      .returning();

    return NextResponse.json(tx);
  } catch (error) {
    console.error("创建交易失败:", error);
    return NextResponse.json(
      { message: "创建交易失败" },
      { status: 500 },
    );
  }
}

// 获取交易列表（分页）
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
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20")));
    const offset = (page - 1) * limit;

    const conditions = [eq(transactions.user_id, user.id)];

    const [result, countResult] = await Promise.all([
      db
        .select()
        .from(transactions)
        .where(and(...conditions))
        .orderBy(desc(transactions.date))
        .limit(limit)
        .offset(offset),
      db.$count(transactions, and(...conditions)),
    ]);

    return NextResponse.json({
      data: result,
      total: countResult,
      page,
      limit,
      totalPages: Math.ceil(countResult / limit),
    });
  } catch (error) {
    console.error("获取交易列表失败:", error);
    return NextResponse.json(
      { message: "获取交易列表失败" },
      { status: 500 },
    );
  }
}
