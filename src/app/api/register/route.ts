import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/password";
import { createToken } from "@/lib/jwt";
import { registerSchema } from "@/lib/validation";
import { parseBody } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    const parsed = await parseBody(request, registerSchema);
    if ("errorResponse" in parsed) return parsed.errorResponse;

    const { email, name, password } = parsed.data;

    // 检查邮箱是否注册
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    if (existingUser) {
      return NextResponse.json(
        { message: "email already registered" },
        { status: 409 },
      );
    }

    const hashedPassword = await hashPassword(password);
    const [newUser] = await db
      .insert(users)
      .values({ email, name, password: hashedPassword })
      .returning();

    const token = await createToken({ sub: newUser.email });

    return NextResponse.json({
      ok: true,
      token,
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      create_at: newUser.create_at,
    });
  } catch (error) {
    console.error("Error registering user", error);
    return NextResponse.json(
      { message: "internal server error" },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
