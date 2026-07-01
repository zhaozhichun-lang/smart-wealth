"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRightLeft,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
  Sparkles,
  PlusIcon,
} from "lucide-react";
import { transactionApi } from "@/lib/transaction";
import { goalApi } from "@/lib/goal";
import { dashboardApi, CurrentUser } from "@/lib/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { TrendChart } from "@/components/charts/TrendChart";
import { CategoryChart } from "@/components/charts/CategoryChart";
import { useIsGuest } from "@/hooks/useIsGuest";

// ============ 类型 ============

interface Transaction {
  id: number;
  type: "income" | "expense";
  category: string;
  amount: string;
  date: string;
  description: string | null;
  source: string | null;
}

interface Goal {
  id: number;
  title: string;
  target_amount: string;
  current_amount: string;
  deadline: string | null;
}

interface Summary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  count: number;
}

// ============ 工具函数 ============

function formatCurrency(amount: number): string {
  return `¥${amount.toFixed(2)}`;
}

function calcProgress(current: string, target: string): number {
  const c = parseFloat(current) || 0;
  const t = parseFloat(target) || 1;
  return Math.min(100, Math.round((c / t) * 100));
}

function getTodayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const d = now.getDate();
  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
  const w = weekdays[now.getDay()];
  return `${y}年${m}月${d}日 星期${w}`;
}

// ============ 骨架屏 ============

function HomeSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* 欢迎语骨架 */}
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-4 w-40" />

      {/* 统计卡片骨架 */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>

      {/* 双列骨架 */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>

      {/* AI 建议骨架 */}
      <Skeleton className="h-20 w-full rounded-xl" />
    </div>
  );
}

// ============ 子组件 ============

/** 统计卡片 */
function StatCard({
  title,
  value,
  icon: Icon,
  accent,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: "green" | "red" | "blue" | "default";
}) {
  const colorMap = {
    green: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    red: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    default: "bg-muted text-muted-foreground",
  };

  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${colorMap[accent]}`}
        >
          <Icon className="size-5" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-xs text-muted-foreground">{title}</span>
          <span className="text-lg font-bold truncate">{value}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ============ 首页 ============

export default function Home() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const isGuest = useIsGuest();

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setLoadError(false);

    try {
      const [txRes, goalRes, userData] = await Promise.all([
        transactionApi.list(1, 1000).catch(() => ({ data: [] })),
        goalApi.list(1, 100).catch(() => ({ data: [] })),
        dashboardApi.getCurrentUser().catch(() => null),
      ]);
      const txData = txRes.data || [];
      const goalData = goalRes.data || [];

      // 用户信息
      if (userData) setUser(userData);

      // 交易汇总
      if (Array.isArray(txData)) {
        const income = txData
          .filter((t: Transaction) => t.type === "income")
          .reduce((sum: number, t: Transaction) => sum + parseFloat(t.amount), 0);
        const expense = txData
          .filter((t: Transaction) => t.type === "expense")
          .reduce((sum: number, t: Transaction) => sum + parseFloat(t.amount), 0);

        setSummary({
          totalIncome: income,
          totalExpense: expense,
          balance: income - expense,
          count: txData.length,
        });

        // 全量交易（给图表用）+ 最近 5 条
        setAllTransactions(txData);
        const sorted = [...txData].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );
        setRecentTransactions(sorted.slice(0, 5));
      }

      // 储蓄目标
      if (Array.isArray(goalData)) {
        setGoals(goalData);
      }
    } catch {
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }

    // AI 建议独立加载，失败不影响主内容
    dashboardApi
      .getSuggestion()
      .then(setSuggestion)
      .catch(() => setSuggestion(null));
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // 加载中
  if (isLoading) {
    return <HomeSkeleton />;
  }

  // 加载失败
  if (loadError) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center gap-4 p-6">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-destructive">
              加载失败
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              获取数据时出错，请检查网络后重试。
            </p>
            <Button onClick={fetchAll} variant="outline">
              重新加载
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* ====== 欢迎语 ====== */}
      <div>
        <h1 className="text-2xl font-bold">
          👋 欢迎回来{user?.name ? `，${user.name}` : ""}
        </h1>
        <p className="text-sm text-muted-foreground">{getTodayString()}</p>
      </div>

      {/* ====== 统计卡片 ====== */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          title="总收入"
          value={summary ? formatCurrency(summary.totalIncome) : "--"}
          icon={TrendingUp}
          accent="green"
        />
        <StatCard
          title="总支出"
          value={summary ? formatCurrency(summary.totalExpense) : "--"}
          icon={TrendingDown}
          accent="red"
        />
        <StatCard
          title="结余"
          value={summary ? formatCurrency(summary.balance) : "--"}
          icon={Wallet}
          accent="blue"
        />
        <StatCard
          title="交易笔数"
          value={summary ? `${summary.count} 笔` : "--"}
          icon={ArrowRightLeft}
          accent="default"
        />
      </div>

      {/* ====== 最近交易 + 储蓄目标 ====== */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* 最近交易 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">📋 最近交易</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/transactions">查看全部 →</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <span className="text-3xl">📭</span>
                <p className="text-sm text-muted-foreground">暂无交易记录</p>
                {!isGuest && (
                  <Button size="sm" asChild>
                    <Link href="/transactions">
                      <PlusIcon />
                      添加第一笔
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {recentTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-lg">
                        {tx.type === "income" ? "💰" : "💸"}
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium truncate">
                          {tx.category}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {tx.date}
                          {tx.description && ` · ${tx.description}`}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 text-sm font-semibold ${
                        tx.type === "income" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {tx.type === "income" ? "+" : "-"}
                      {formatCurrency(Math.abs(parseFloat(tx.amount)))}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 储蓄目标 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">🎯 储蓄目标</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/goals">查看全部 →</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {goals.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <span className="text-3xl">🎯</span>
                <p className="text-sm text-muted-foreground">暂无储蓄目标</p>
                {!isGuest && (
                  <Button size="sm" asChild>
                    <Link href="/goals">
                      <PlusIcon />
                      设定目标
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {goals.slice(0, 4).map((goal) => {
                  const progress = calcProgress(
                    goal.current_amount,
                    goal.target_amount,
                  );
                  const barColor =
                    progress >= 100
                      ? "bg-green-500"
                      : progress >= 50
                        ? "bg-primary"
                        : "bg-amber-500";

                  return (
                    <div key={goal.id} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate">
                          {goal.title}
                        </span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {progress}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(parseFloat(goal.current_amount))} /{" "}
                        {formatCurrency(parseFloat(goal.target_amount))}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ====== 图表：收入支出趋势 + 支出分类 ====== */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">📈 收支趋势</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendChart transactions={allTransactions} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">🍩 支出分类</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryChart transactions={allTransactions} />
          </CardContent>
        </Card>
      </div>

      {/* ====== AI 智能建议 ====== */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-start gap-3 p-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="size-4 text-primary" />
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-sm font-medium">💡 AI 财务建议</span>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {suggestion === null
                ? "正在为你生成建议…"
                : suggestion || "暂无建议，请检查 AI 服务配置。"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ====== 快捷操作 ====== */}
      {!isGuest && (
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/transactions">
              <ArrowRightLeft />
              管理交易
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/goals">
              <Target />
              管理目标
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
