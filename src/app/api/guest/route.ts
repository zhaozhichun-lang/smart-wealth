import { NextResponse } from "next/server";
import {
  getOrCreateGuestUser,
  createGuestToken,
  GUEST_EMAIL,
  GUEST_NAME,
} from "@/lib/guest";

export const dynamic = "force-dynamic";

/** GET /api/guest — 自动为游客创建/返回 JWT */
export async function GET() {
  try {
    const userId = await getOrCreateGuestUser();
    const token = await createGuestToken();

    return NextResponse.json({
      token,
      email: GUEST_EMAIL,
      name: GUEST_NAME,
      id: userId,
    });
  } catch (error) {
    console.error("游客登录失败:", error);
    return NextResponse.json(
      { message: "游客登录失败，请稍后重试" },
      { status: 500 },
    );
  }
}
