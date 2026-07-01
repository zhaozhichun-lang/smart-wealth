import { z } from "zod";

// ====== 认证 ======

export const registerSchema = z.object({
  email: z
    .string({ required_error: "邮箱不能为空" })
    .email("邮箱格式不正确"),
  password: z
    .string({ required_error: "密码不能为空" })
    .min(8, "密码至少 8 位")
    .max(20, "密码最多 20 位"),
  name: z.string().optional(),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: "邮箱不能为空" })
    .email("邮箱格式不正确"),
  password: z.string({ required_error: "密码不能为空" }),
});

// ====== 交易 ======

export const createTransactionSchema = z.object({
  type: z.enum(["income", "expense"], {
    required_error: "类型不能为空",
    invalid_type_error: "类型必须是 income 或 expense",
  }),
  category: z
    .string({ required_error: "分类不能为空" })
    .min(1, "分类不能为空"),
  amount: z
    .number({ required_error: "金额不能为空", invalid_type_error: "金额必须是数字" })
    .positive("金额必须是正数"),
  date: z.string().optional(),
  description: z.string().optional(),
  source: z.string().optional(),
});

export const updateTransactionSchema = z.object({
  type: z.enum(["income", "expense"]).optional(),
  category: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  date: z.string().optional(),
  description: z.string().optional(),
  source: z.string().optional(),
});

// ====== 目标 ======

export const createGoalSchema = z.object({
  title: z
    .string({ required_error: "标题不能为空" })
    .min(1, "标题不能为空"),
  target_amount: z
    .number({ required_error: "目标金额不能为空", invalid_type_error: "金额必须是数字" })
    .positive("目标金额必须是正数"),
  current_amount: z.number().min(0).optional().default(0),
  deadline: z.string().optional(),
});

export const updateGoalSchema = z.object({
  title: z.string().min(1).optional(),
  target_amount: z.number().positive().optional(),
  current_amount: z.number().min(0).optional(),
  deadline: z.string().optional().nullable(),
});

// ====== AI 对话 ======

export const chatMessageSchema = z.object({
  message: z
    .string({ required_error: "消息不能为空" })
    .min(1, "消息不能为空"),
});

// ====== 用户资料 ======

export const updateProfileSchema = z.object({
  name: z.string().min(1, "昵称不能为空").optional(),
  currentPassword: z.string().optional(),
  newPassword: z
    .string()
    .min(8, "新密码至少 8 位")
    .max(20, "新密码最多 20 位")
    .optional(),
});

// ====== 类型导出 ======

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
