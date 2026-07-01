import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { goals } from "@/db/schema";
import { getCurrentUser, isGuest } from "@/lib/auth_utils";
import { eq, and } from "drizzle-orm";
import { updateGoalSchema } from "@/lib/validation";
import { parseBody } from "@/lib/api-utils";

// 更新财务目标
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json(
      { message: "未登录或 token 已过期" },
      { status: 401 },
    );
  }

  // 游客不允许修改目标
  if (isGuest(user)) {
    return NextResponse.json(
      { message: "游客模式仅支持查看" },
      { status: 403 },
    );
  }

  try {
    const { id } = await params;
    const goalId = parseInt(id, 10);
    if (isNaN(goalId)) {
      return NextResponse.json(
        { message: "目标 ID 无效" },
        { status: 400 },
      );
    }

    const parsed = await parseBody(request, updateGoalSchema);
    if ("errorResponse" in parsed) return parsed.errorResponse;

    const [existing] = await db
      .select()
      .from(goals)
      .where(and(eq(goals.id, goalId), eq(goals.user_id, user.id)));

    if (!existing) {
      return NextResponse.json(
        { message: "目标不存在或无权操作" },
        { status: 404 },
      );
    }

    const { title, target_amount, current_amount, deadline } = parsed.data;

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (target_amount !== undefined) updateData.target_amount = target_amount.toString();
    if (current_amount !== undefined) updateData.current_amount = current_amount.toString();
    if (deadline !== undefined) updateData.deadline = deadline || null;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: "没有需要更新的字段" },
        { status: 400 },
      );
    }

    const [updated] = await db
      .update(goals)
      .set(updateData)
      .where(eq(goals.id, goalId))
      .returning();

    return NextResponse.json({
      ...updated,
      target_amount: Number(updated.target_amount),
      current_amount: Number(updated.current_amount),
    });
  } catch (error) {
    console.error("更新目标失败:", error);
    return NextResponse.json(
      { message: "更新目标失败" },
      { status: 500 },
    );
  }
}

// 删除财务目标
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json(
      { message: "未登录或 token 已过期" },
      { status: 401 },
    );
  }

  // 游客不允许删除目标
  if (isGuest(user)) {
    return NextResponse.json(
      { message: "游客模式仅支持查看" },
      { status: 403 },
    );
  }

  try {
    const { id } = await params;
    const goalId = parseInt(id, 10);
    if (isNaN(goalId)) {
      return NextResponse.json(
        { message: "目标 ID 无效" },
        { status: 400 },
      );
    }

    const [existing] = await db
      .select()
      .from(goals)
      .where(and(eq(goals.id, goalId), eq(goals.user_id, user.id)));

    if (!existing) {
      return NextResponse.json(
        { message: "目标不存在或无权操作" },
        { status: 404 },
      );
    }

    await db.delete(goals).where(eq(goals.id, goalId));

    return NextResponse.json({ message: "删除成功" });
  } catch (error) {
    console.error("删除目标失败:", error);
    return NextResponse.json(
      { message: "删除目标失败" },
      { status: 500 },
    );
  }
}
