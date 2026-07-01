import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { comparePassword } from "@/lib/password";
import { createToken } from "@/lib/jwt";
import { loginSchema } from "@/lib/validation";
import { parseBody } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    const parsed = await parseBody(request, loginSchema);
    if ("errorResponse" in parsed) return parsed.errorResponse;

    const { email, password } = parsed.data;

    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    if (!existingUser) {
      return NextResponse.json(
        { message: "email not registered" },
        { status: 400 },
      );
    }

    const isPasswordValid = await comparePassword(password, existingUser.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "password is incorrect" },
        { status: 401 },
      );
    }

    const token = await createToken({ sub: existingUser.email });

    return NextResponse.json({
      token,
      email: existingUser.email,
      name: existingUser.name,
    });
  } catch (error) {
    console.error("Error logging in user:", error);
    return NextResponse.json(
      { message: "登录失败，请稍后重试" },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
