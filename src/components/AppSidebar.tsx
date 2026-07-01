"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Settings,
  HelpCircle,
  User,
  ChevronUp,
  LogOut,
  GalleryVerticalEnd,
  Sun,
  Moon,
  Settings2,
  ArrowRightLeft,
  Target,
  PieChart,
  MessageCircle,
  Radio,
} from "lucide-react";
import { useTheme } from "next-themes";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const GUEST_EMAIL = "test_guest@smart-wealth.local";

// 导航数据结构
const navItems = [
  {
    title: "首页",
    url: "/",
    icon: Settings2,
    isActive: true,
  },
  {
    title: "交易管理",
    url: "/transactions",
    icon: ArrowRightLeft,
    isActive: true,
  },
  {
    title: "储蓄目标",
    url: "/goals",
    icon: Target,
    isActive: true,
  },
  {
    title: "预算分析",
    url: "/budgets",
    icon: PieChart,
    isActive: true,
  },
  {
    title: "智能教练",
    url: "/coach",
    icon: MessageCircle,
    isActive: true,
  },
  {
    title: "智能教练(流式)",
    url: "/coach-stream",
    icon: Radio,
    isActive: true,
  },
];

const supportItems = [
  {
    title: "设置",
    url: "/settings",
    icon: Settings,
  },
  {
    title: "帮助中心",
    url: "/help",
    icon: HelpCircle,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { setTheme, resolvedTheme } = useTheme();
  const [user, setUser] = useState<{ nickname: string; email: string } | null>(
    null,
  );
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    const loginInfo = localStorage.getItem("loginInfo");
    if (loginInfo) {
      try {
        const parsed = JSON.parse(loginInfo);
        setUser(parsed);
        setIsGuest(parsed.email === GUEST_EMAIL);
      } catch {
        // ignore
      }
    }
  }, []);

  return (
    <Sidebar collapsible="icon">
      {/* ====== 头部：应用 Logo + 名称 ====== */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <GalleryVerticalEnd className="size-4" />
              </div>
              <div className="ml-2 flex flex-col items-start text-left text-sm leading-tight">
                <span className="font-semibold truncate">Smart-Wealth</span>
                <span className="text-xs text-muted-foreground truncate">
                  智能财富管理
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* ====== 主导航 ====== */}
        <SidebarGroup>
          <SidebarGroupLabel>导航</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* ====== 辅助导航 ====== */}
        <SidebarGroup>
          <SidebarGroupLabel>更多</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {supportItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ====== 底部：用户信息 ====== */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <User className="size-4" />
                  </div>
                  <div className="ml-2 flex flex-col items-start text-left text-sm leading-tight">
                    <span className="font-medium truncate">
                      {isGuest ? "游客体验" : user?.nickname || "用户"}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {isGuest ? "演示模式" : user?.email || ""}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-(--radix-dropdown-menu-trigger-width)"
              >
                {!isGuest && (
                  <DropdownMenuItem
                    onClick={() => (window.location.href = "/profile")}
                  >
                    <User className="mr-2 size-4" />
                    <span>个人资料</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() =>
                    setTheme(resolvedTheme === "dark" ? "light" : "dark")
                  }
                >
                  {resolvedTheme === "dark" ? (
                    <Sun className="mr-2 size-4" />
                  ) : (
                    <Moon className="mr-2 size-4" />
                  )}
                  <span>切换主题</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    localStorage.removeItem("token");
                    localStorage.removeItem("loginInfo");
                    window.location.href = "/";
                  }}
                >
                  <LogOut className="mr-2 size-4" />
                  <span>{isGuest ? "退出演示" : "退出登录"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
