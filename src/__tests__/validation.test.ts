import { describe, it, expect } from "vitest";
import {
  registerSchema,
  loginSchema,
  createTransactionSchema,
  updateTransactionSchema,
  createGoalSchema,
  updateGoalSchema,
  chatMessageSchema,
  updateProfileSchema,
} from "@/lib/validation";

describe("registerSchema", () => {
  it("accepts valid registration data", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      password: "12345678",
      name: "测试",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = registerSchema.safeParse({ email: "not-email", password: "12345678" });
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = registerSchema.safeParse({ email: "a@b.com", password: "123" });
    expect(result.success).toBe(false);
  });

  it("rejects missing email", () => {
    const result = registerSchema.safeParse({ password: "12345678" });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts valid login", () => {
    const result = loginSchema.safeParse({ email: "a@b.com", password: "anything" });
    expect(result.success).toBe(true);
  });

  it("rejects missing password", () => {
    const result = loginSchema.safeParse({ email: "a@b.com" });
    expect(result.success).toBe(false);
  });
});

describe("createTransactionSchema", () => {
  it("accepts valid expense", () => {
    const result = createTransactionSchema.safeParse({
      type: "expense",
      category: "餐饮",
      amount: 35.5,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.amount).toBe(35.5);
  });

  it("rejects invalid type", () => {
    const result = createTransactionSchema.safeParse({
      type: "invalid",
      category: "餐饮",
      amount: 35,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative amount", () => {
    const result = createTransactionSchema.safeParse({
      type: "expense",
      category: "餐饮",
      amount: -10,
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-number amount", () => {
    const result = createTransactionSchema.safeParse({
      type: "expense",
      category: "餐饮",
      amount: "abc",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateTransactionSchema", () => {
  it("accepts partial update", () => {
    const result = updateTransactionSchema.safeParse({ category: "交通" });
    expect(result.success).toBe(true);
  });

  it("accepts empty object", () => {
    const result = updateTransactionSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects invalid type in update", () => {
    const result = updateTransactionSchema.safeParse({ type: "invalid" });
    expect(result.success).toBe(false);
  });
});

describe("createGoalSchema", () => {
  it("accepts valid goal", () => {
    const result = createGoalSchema.safeParse({
      title: "买房首付",
      target_amount: 500000,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.current_amount).toBe(0);
  });

  it("rejects missing title", () => {
    const result = createGoalSchema.safeParse({ target_amount: 100 });
    expect(result.success).toBe(false);
  });

  it("rejects zero target_amount", () => {
    const result = createGoalSchema.safeParse({ title: "test", target_amount: 0 });
    expect(result.success).toBe(false);
  });
});

describe("updateGoalSchema", () => {
  it("accepts deadline as null", () => {
    const result = updateGoalSchema.safeParse({ deadline: null });
    expect(result.success).toBe(true);
  });
});

describe("chatMessageSchema", () => {
  it("accepts valid message", () => {
    const result = chatMessageSchema.safeParse({ message: "你好" });
    expect(result.success).toBe(true);
  });

  it("rejects empty message", () => {
    const result = chatMessageSchema.safeParse({ message: "" });
    expect(result.success).toBe(false);
  });
});

describe("updateProfileSchema", () => {
  it("accepts name only", () => {
    const result = updateProfileSchema.safeParse({ name: "张三" });
    expect(result.success).toBe(true);
  });

  it("accepts password change", () => {
    const result = updateProfileSchema.safeParse({ newPassword: "12345678" });
    expect(result.success).toBe(true);
  });

  it("rejects short new password", () => {
    const result = updateProfileSchema.safeParse({ newPassword: "123" });
    expect(result.success).toBe(false);
  });
});
