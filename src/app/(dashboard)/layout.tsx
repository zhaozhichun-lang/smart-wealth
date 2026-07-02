"use client";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Toaster } from "sonner";

const GUEST_EMAIL = "test_guest@smart-wealth.local";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isAuth, setIsAuth] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const loginInfo = localStorage.getItem("loginInfo");

    // 已有 token 和 loginInfo — 直接通过
    if (token && loginInfo) {
      try {
        const parsed = JSON.parse(loginInfo);
        setIsAuth(true);
        setIsGuest(parsed.email === GUEST_EMAIL);
      } catch {
        setIsAuth(false);
      }
      setIsLoading(false);
      return;
    }

    // 无 token — 自动获取游客身份
    fetch("/api/guest")
      .then((res) => res.json())
      .then((data) => {
        if (data.token) {
          localStorage.setItem("token", data.token);
          localStorage.setItem(
            "loginInfo",
            JSON.stringify({
              email: data.email,
              nickname: data.name,
            }),
          );
          setIsAuth(true);
          setIsGuest(true);
        } else {
          setIsAuth(false);
        }
      })
      .catch(() => {
        setIsAuth(false);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // 骨架屏（初始加载中）
  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-4 h-screen">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    );
  }

  // 加载失败（极少情况）
  if (!isAuth) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">加载失败，请刷新页面重试</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <main className="flex flex-1 flex-col min-w-0 overflow-auto">
          <SidebarTrigger />
          {isGuest && (
            <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
              <span>🏷️ 您正在以游客身份浏览演示数据</span>
              <a
                href="/login"
                className="underline underline-offset-2 hover:text-foreground transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  localStorage.removeItem("token");
                  localStorage.removeItem("loginInfo");
                  window.location.href = "/login";
                }}
              >
                登录真实账号
              </a>
            </div>
          )}
          {children}
        </main>
        <Toaster richColors />
      </SidebarProvider>
    </TooltipProvider>
  );
}
