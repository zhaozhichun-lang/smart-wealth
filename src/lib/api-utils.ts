import { NextResponse } from "next/server";
import { ZodSchema, ZodError } from "zod";

/**
 * 解析请求体并用 zod schema 校验。
 * 校验失败时直接返回 400 响应；成功时返回解析后的数据。
 */
export async function parseBody<T>(
  request: Request,
  schema: ZodSchema<T>,
): Promise<{ data: T } | { errorResponse: NextResponse }> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return {
      errorResponse: NextResponse.json(
        { message: "请求体格式错误，需要 JSON" },
        { status: 400 },
      ),
    };
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    const first = result.error.issues[0];
    return {
      errorResponse: NextResponse.json(
        { message: first?.message || "参数校验失败" },
        { status: 400 },
      ),
    };
  }

  return { data: result.data };
}
