import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { goals } from "@/db/schema";
import { getCurrentUser, isGuest } from "@/lib/auth_utils";
import { ensureGuestDataFresh } from "@/lib/guest";
import { eq, desc } from "drizzle-orm";
import { createGoalSchema } from "@/lib/validation";
import { parseBody } from "@/lib/api-utils";

// 查询财务目标列表（分页）
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
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "12")));
    const offset = (page - 1) * limit;

    const [list, countResult] = await Promise.all([
      db
        .select()
        .from(goals)
        .where(eq(goals.user_id, user.id))
        .orderBy(desc(goals.create_at))
        .limit(limit)
        .offset(offset),
      db.$count(goals, eq(goals.user_id, user.id)),
    ]);

    const data = list.map((item) => ({
      ...item,
      target_amount: Number(item.target_amount),
      current_amount: Number(item.current_amount),
    }));

    return NextResponse.json({
      data,
      total: countResult,
      page,
      limit,
      totalPages: Math.ceil(countResult / limit),
    });
  } catch (error) {
    console.error("查询目标列表失败:", error);
    return NextResponse.json(
      { message: "查询目标列表失败" },
      { status: 500 },
    );
  }
}

// 创建财务目标
export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json(
      { message: "未登录或 token 已过期" },
      { status: 401 },
    );
  }

  // 游客不允许创建目标
  if (isGuest(user)) {
    return NextResponse.json(
      { message: "游客模式仅支持查看" },
      { status: 403 },
    );
  }

  try {
    const parsed = await parseBody(request, createGoalSchema);
    if ("errorResponse" in parsed) return parsed.errorResponse;

    const { title, target_amount, current_amount, deadline } = parsed.data;

    const [goal] = await db
      .insert(goals)
      .values({
        user_id: user.id,
        title,
        target_amount: target_amount.toString(),
        current_amount: (current_amount ?? 0).toString(),
        deadline: deadline || null,
      })
      .returning();

    return NextResponse.json({
      ...goal,
      target_amount: Number(goal.target_amount),
      current_amount: Number(goal.current_amount),
    });
  } catch (error) {
    console.error("创建目标失败:", error);
    return NextResponse.json(
      { message: "创建目标失败" },
      { status: 500 },
    );
  }
}
