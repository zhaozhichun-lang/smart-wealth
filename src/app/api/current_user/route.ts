import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isGuest } from "@/lib/auth_utils";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, comparePassword } from "@/lib/password";
import { updateProfileSchema } from "@/lib/validation";
import { parseBody } from "@/lib/api-utils";

// 获取当前用户信息
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { message: "未登录或 token 已过期" },
        { status: 401 },
      );
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
    });
  } catch (error) {
    console.error("Error getting current user:", error);
    return NextResponse.json(
      { message: "获取用户信息失败" },
      { status: 500 },
    );
  }
}

// 更新当前用户资料
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { message: "未登录或 token 已过期" },
        { status: 401 },
      );
    }

    // 游客不允许修改个人资料
    if (isGuest(user)) {
      return NextResponse.json(
        { message: "游客模式仅支持查看" },
        { status: 403 },
      );
    }

    const parsed = await parseBody(request, updateProfileSchema);
    if ("errorResponse" in parsed) return parsed.errorResponse;

    const { name, currentPassword, newPassword } = parsed.data;

    const updateData: Record<string, string> = {};

    // 更新昵称
    if (name !== undefined) {
      updateData.name = name.trim();
    }

    // 修改密码
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { message: "请输入当前密码" },
          { status: 400 },
        );
      }

      // 查询当前用户的密码哈希
      const [existingUser] = await db
        .select({ password: users.password })
        .from(users)
        .where(eq(users.id, user.id));

      if (!existingUser) {
        return NextResponse.json(
          { message: "用户不存在" },
          { status: 404 },
        );
      }

      // 验证当前密码
      const isValid = await comparePassword(
        currentPassword,
        existingUser.password,
      );
      if (!isValid) {
        return NextResponse.json(
          { message: "当前密码不正确" },
          { status: 400 },
        );
      }

      updateData.password = await hashPassword(newPassword);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: "没有需要更新的字段" },
        { status: 400 },
      );
    }

    // 更新数据库
    const [updated] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, user.id))
      .returning();

    return NextResponse.json({
      id: updated.id,
      email: updated.email,
      name: updated.name,
    });
  } catch (error) {
    console.error("更新用户信息失败:", error);
    return NextResponse.json(
      { message: "更新用户信息失败" },
      { status: 500 },
    );
  }
}
