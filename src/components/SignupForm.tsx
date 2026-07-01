"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { authApi } from "@/lib/auth_api";
import { useRouter } from "next/navigation";

export function SignupForm() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;

    setFormData({
      ...formData,
      [id]: value,
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    // value 去除空格
    const name = formData.name.trim();
    const email = formData.email.trim();
    const password = formData.password.trim();
    const confirmPassword = formData.confirmPassword.trim();

    if (!name || !email || !password || !confirmPassword) {
      setError("请填写完整信息");
      setLoading(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("邮箱格式不正确");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("密码长度至少8位字符");
      setLoading(false);
      return;
    }

    // 密码和确认密码一致检查
    if (password !== confirmPassword) {
      setError("密码和确认密码不一致");
      setLoading(false);
      return;
    }

    const data = {
      name,
      email,
      password,
    };

    try {
      const result = await authApi.register(data);

      // 注册成功后保存 token 和用户信息，直接进入登录状态
      localStorage.setItem("token", result.token);
      const userInfo = {
        email: result.email,
        nickname: result.name,
      };
      localStorage.setItem("loginInfo", JSON.stringify(userInfo));

      setSuccess("注册成功");

      setTimeout(() => {
        setError("");
        setSuccess("");
        router.replace("/login");
      }, 1000);
    } catch (err: any) {
      setError(err.message || "注册失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>注册账号</CardTitle>
        <CardDescription>输入一下信息完成用户创建</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-md">
              {success}
            </div>
          )}
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">
                昵称<span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="name"
                placeholder="昵称"
                required
                value={formData.name}
                onChange={handleChange}
              />
              <FieldDescription>昵称至少2个字符以上.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="email">
                邮箱<span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="demo@example.com"
                required
                value={formData.email}
                onChange={handleChange}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">
                密码<span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="password"
                type="password"
                placeholder="password"
                value={formData.password}
                onChange={handleChange}
              />
              <FieldDescription>密码长度至少8位字符</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="confirmPassword">
                确认密码<span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </Field>
            <Field>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "注册中..." : "创建账号"}
              </Button>
              <FieldDescription className="text-center">
                如果已经有账号？ <Link href="/login">登录</Link>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
