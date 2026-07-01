"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  Sun,
  Moon,
  Monitor,
  User,
  LogOut,
  Trash2,
  ShieldCheck,
  Info,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useIsGuest } from "@/hooks/useIsGuest";

type ThemeMode = "light" | "dark" | "system";

export default function Settings() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null);
  const isGuest = useIsGuest();

  useEffect(() => {
    setMounted(true);
    const loginInfo = localStorage.getItem("loginInfo");
    if (loginInfo) {
      try { setUser(JSON.parse(loginInfo)); } catch { /* ignore */ }
    }
  }, []);

  const handleSetTheme = (mode: ThemeMode) => setTheme(mode);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("loginInfo");
    toast.success(isGuest ? "已退出演示" : "已退出登录");
    window.location.href = "/";
  };

  const handleClearCache = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("loginInfo");
    toast.success("本地缓存已清除");
    window.location.href = "/login";
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col gap-6 p-6 max-w-2xl">
      <h1 className="text-2xl font-bold">设置</h1>

      {/* ====== 个人资料 ====== */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="size-4" /> 个人资料
          </CardTitle>
          <CardDescription>你的账户基本信息</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">昵称</span>
            <span className="text-sm font-medium">{isGuest ? "游客体验" : user?.name || "未设置"}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">邮箱</span>
            <span className="text-sm font-medium">{user?.email || "未知"}</span>
          </div>
        </CardContent>
      </Card>

      {/* ====== 主题 ====== */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Monitor className="size-4" /> 外观主题
          </CardTitle>
          <CardDescription>选择你喜欢的界面主题</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {([
              { key: "light", label: "浅色", icon: Sun },
              { key: "dark", label: "深色", icon: Moon },
              { key: "system", label: "跟随系统", icon: Monitor },
            ] as const).map(({ key, label, icon: Icon }) => (
              <Button
                key={key}
                variant={resolvedTheme === key ? "default" : "outline"}
                className="flex-col gap-2 h-auto py-4"
                onClick={() => handleSetTheme(key)}
              >
                <Icon className="size-5" />
                <span className="text-xs">{label}</span>
                {resolvedTheme === key && <Check className="size-3" />}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ====== 数据管理 ====== */}
      {!isGuest && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Trash2 className="size-4" /> 数据管理
            </CardTitle>
            <CardDescription>清除本地缓存的登录状态和数据</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={handleClearCache}>
              <Trash2 className="size-4" />
              清除本地缓存
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ====== 安全 ====== */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="size-4" /> 账户安全
          </CardTitle>
          <CardDescription>管理你的登录会话</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleLogout}>
            <LogOut className="size-4" />
            {isGuest ? "退出演示" : "退出登录"}
          </Button>
        </CardContent>
      </Card>

      {/* ====== 关于 ====== */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="size-4" /> 关于
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>应用名称</span>
            <span className="font-medium text-foreground">Smart-Wealth 智能财富管理</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span>版本</span>
            <span className="font-medium text-foreground">v1.0.0</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span>技术栈</span>
            <span className="font-medium text-foreground">Next.js 16 + PostgreSQL + OpenAI</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
