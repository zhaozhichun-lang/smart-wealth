import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import { getCurrentUser, isGuest } from "@/lib/auth_utils";
import { eq, and } from "drizzle-orm";
import { updateTransactionSchema } from "@/lib/validation";
import { parseBody } from "@/lib/api-utils";

// 删除交易
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

  // 游客不允许删除交易
  if (isGuest(user)) {
    return NextResponse.json(
      { message: "游客模式仅支持查看" },
      { status: 403 },
    );
  }

  const { id } = await params;
  const transactionId = parseInt(id);

  if (isNaN(transactionId)) {
    return NextResponse.json(
      { message: "无效的交易 ID" },
      { status: 400 },
    );
  }

  try {
    const [existing] = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.id, transactionId),
          eq(transactions.user_id, user.id),
        ),
      );

    if (!existing) {
      return NextResponse.json(
        { message: "交易记录不存在" },
        { status: 404 },
      );
    }

    await db.delete(transactions).where(eq(transactions.id, transactionId));

    return NextResponse.json({ message: "交易记录删除成功" });
  } catch (error) {
    console.error("删除交易失败:", error);
    return NextResponse.json({ message: "删除失败" }, { status: 500 });
  }
}

// 修改交易
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

  // 游客不允许修改交易
  if (isGuest(user)) {
    return NextResponse.json(
      { message: "游客模式仅支持查看" },
      { status: 403 },
    );
  }

  const { id } = await params;
  const transactionId = parseInt(id);

  if (isNaN(transactionId)) {
    return NextResponse.json(
      { message: "无效的交易 ID" },
      { status: 400 },
    );
  }

  try {
    const parsed = await parseBody(request, updateTransactionSchema);
    if ("errorResponse" in parsed) return parsed.errorResponse;

    // 验证交易存在且属于当前用户
    const [existing] = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.id, transactionId),
          eq(transactions.user_id, user.id),
        ),
      );

    if (!existing) {
      return NextResponse.json(
        { message: "交易不存在 无法修改" },
        { status: 404 },
      );
    }

    const { type, category, amount, description, source, date } = parsed.data;

    const updateData: Record<string, unknown> = {};
    if (type !== undefined) updateData.type = type;
    if (category !== undefined) updateData.category = category;
    if (amount !== undefined) updateData.amount = amount.toString();
    if (description !== undefined) updateData.description = description;
    if (source !== undefined) updateData.source = source;
    if (date !== undefined) updateData.date = date;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: "请提供要修改的字段" },
        { status: 400 },
      );
    }

    const [updated] = await db
      .update(transactions)
      .set(updateData)
      .where(eq(transactions.id, transactionId))
      .returning();

    return NextResponse.json({
      message: "交易修改成功",
      data: updated,
    });
  } catch (error) {
    console.error("修改交易失败:", error);
    return NextResponse.json({ message: "修改交易失败" }, { status: 500 });
  }
}
