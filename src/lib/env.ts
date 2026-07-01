import { z } from "zod";

/**
 * 环境变量 Schema — 启动时校验
 * 任何缺失或格式错误的环境变量都会导致明确的报错，而不是运行时崩溃。
 */
const envSchema = z.object({
  // 数据库
  DATABASE_URL: z
    .string({ required_error: "DATABASE_URL 未设置" })
    .url("DATABASE_URL 格式不正确"),

  // JWT
  JWT_SECRET: z
    .string({ required_error: "JWT_SECRET 未设置" })
    .min(16, "JWT_SECRET 长度至少 16 位，建议使用 openssl rand -hex 32 生成"),
  JWT_ALGORITHM: z.string().default("HS256"),
  TOKEN_EXPIRES_IN: z.string().default("300m"),

  // DeepSeek / OpenAI
  DEEPSEEK_API_KEY: z
    .string({ required_error: "DEEPSEEK_API_KEY 未设置" })
    .min(1, "DEEPSEEK_API_KEY 不能为空"),
  DEEPSEEK_BASE_URL: z.string().url().default("https://api.deepseek.com"),
  DEEPSEEK_MODEL: z.string().default("deepseek-v4-flash"),
  DEEPSEEK_SYSTEM_PROMPT: z.string().default("You are a helpful assistant."),
});

// ====== 解析 & 校验 ======

let _env: z.infer<typeof envSchema> | null = null;

export function getEnv() {
  if (_env) return _env;

  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`❌ 环境变量校验失败:\n${issues}`);
  }

  _env = result.data;
  return _env;
}

/** 类型安全的环境变量（仅限服务端使用） */
export const env = new Proxy({} as z.infer<typeof envSchema>, {
  get(_, prop: string) {
    return getEnv()[prop as keyof z.infer<typeof envSchema>];
  },
});
