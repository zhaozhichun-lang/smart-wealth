"use client";
import { useEffect } from "react";
import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  useEffect(() => {
    // 已有 token 则直接跳转到首页，无需重复登录
    const token = localStorage.getItem("token");
    const loginInfo = localStorage.getItem("loginInfo");
    if (token && loginInfo) {
      window.location.href = "/";
    }
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <LoginForm />
    </div>
  );
}
