import { NextRequest } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { GUEST_EMAIL } from "@/lib/guest";

/** 从请求中提取 Bearer token */
export function extractToken(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("token请求头无效 或 token 格式错误");
  }
  return authHeader.slice(7);
}

/** 从请求中解析当前登录用户，未认证返回 null */
export async function parseUser(request: NextRequest) {
  try {
    const token = extractToken(request);
    if (!token) return null;

    //   验证token
    const payload = await verifyToken(token);

    //    从token中获取用户邮箱
    const email = payload.sub || "";
    if (!email) {
      return null;
    }

    //    从数据库中查询用户
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    if (!existingUser) {
      return null;
    }

    return {
      id: existingUser.id,
      email: existingUser.email,
      name: existingUser.name,
    };
  } catch (error) {
    return null;
  }
}

/** 从请求中获取当前用户（parseUser 别名） */
export const getCurrentUser = parseUser;

/** 从请求中解析当前登录用户，未认证返回 null（与 parseUser 一致，方便语义表达） */
export async function requireUser(request: NextRequest) {
  return parseUser(request);
}

/** 判断用户是否为游客 */
export function isGuest(user: { email: string } | null): boolean {
  return user?.email === GUEST_EMAIL;
}
