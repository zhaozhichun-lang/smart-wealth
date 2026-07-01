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

export function LoginForm() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
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
    const email = formData.email.trim();
    const password = formData.password.trim();

    if (!email || !password) {
      setError("请填写完整信息");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("密码长度至少8位字符");
      setLoading(false);
      return;
    }

    const data = {
      email,
      password,
    };

    try {
      const result = await authApi.login(data);

      const { token } = result;
      localStorage.setItem("token", token);

      const userInfo = {
        email,
        nickname: result.name,
      };

      localStorage.setItem("loginInfo", JSON.stringify(userInfo));

      setSuccess("登录成功");

      setTimeout(() => {
        setError("");
        setSuccess("");
        router.replace("/");
      }, 1000);
    } catch (err: any) {
      setError(err.message || "登录失败,请检查邮箱和密码");
      return;
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>登录账号</CardTitle>
        <CardDescription>输入一下信息完成用户登录</CardDescription>
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
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "登录中..." : "登录"}
              </Button>
              <FieldDescription className="text-center">
                如果还没有账号？ <Link href="/signup">注册</Link>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
