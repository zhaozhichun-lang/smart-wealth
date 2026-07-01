"use client";

import { useCallback, useEffect, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Calendar,
  BarChart3,
  PiggyBank,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { budgetApi, BudgetAnalysis } from "@/lib/budget";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

// ============ 工具函数 ============

function fmtCurrency(amount: number): string {
  return `¥${amount.toFixed(2)}`;
}

function fmtShort(amount: number): string {
  if (Math.abs(amount) >= 10000) {
    return `${(amount / 10000).toFixed(1)}万`;
  }
  return `¥${amount.toFixed(0)}`;
}

function fmtChange(change: number | null): string {
  if (change === null) return "--";
  const prefix = change > 0 ? "+" : "";
  return `${prefix}${change.toFixed(1)}%`;
}

// 分类颜色
const CAT_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899", "#64748b",
];

// ============ 骨架屏 ============

function BudgetsSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
    </div>
  );
}

// ============ 子组件 ============

/** 概览卡片 */
function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  title: string;
  value: string;
  sub?: string;
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
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${colorMap[accent]}`}>
          <Icon className="size-5" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-xs text-muted-foreground">{title}</span>
          <span className="text-lg font-bold truncate">{value}</span>
          {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

/** 自定义 Tooltip */
function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-md text-sm">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="flex items-center gap-2">
          <span className="inline-block size-2 rounded-full" style={{ backgroundColor: entry.color }} />
          {entry.name === "income" ? "收入" : "支出"}：{fmtCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
}

// ============ 主页面 ============

export default function Budgets() {
  const [data, setData] = useState<BudgetAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await budgetApi.analyze();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "获取分析数据失败");
      toast.error("加载失败", { description: err instanceof Error ? err.message : "未知错误" });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) return <BudgetsSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center gap-4 p-6">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-destructive">加载失败</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button onClick={fetchData} variant="outline">重新加载</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data || data.monthlySummary.length === 0) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center p-6">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-xl font-bold">暂无分析数据</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">添加交易记录后，这里将展示详细的预算分析。</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const thisM = data.thisMonth;
  const lastM = data.lastMonth;

  return (
    <div className="flex flex-col gap-4 p-6">
      <h1 className="text-2xl font-bold">预算分析</h1>

      {/* ====== 当月概览 ====== */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard title="本月收入" value={fmtCurrency(thisM.income)} icon={TrendingUp} accent="green" />
        <StatCard title="本月支出" value={fmtCurrency(thisM.expense)} icon={TrendingDown} accent="red" />
        <StatCard title="本月结余" value={fmtCurrency(thisM.balance)} icon={Wallet} accent="blue" />
        <StatCard
          title="环比变化"
          value={fmtChange(data.expenseChange)}
          sub={data.expenseChange !== null ? (data.expenseChange > 0 ? "较上月支出增加" : "较上月支出减少") : "上月无数据"}
          icon={data.expenseChange !== null && data.expenseChange > 0 ? AlertTriangle : PiggyBank}
          accent={data.expenseChange !== null && data.expenseChange > 0 ? "red" : "green"}
        />
      </div>

      {/* ====== 图表行 ====== */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* 月度趋势柱状图 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">📊 月度收支趋势</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.monthlySummary} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={fmtShort} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={52} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="income" name="income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 当月支出分类柱状图 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">🍩 本月支出分类</CardTitle>
          </CardHeader>
          <CardContent>
            {data.categoryBreakdown.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">本月暂无支出</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={data.categoryBreakdown}
                  layout="vertical"
                  margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                  <XAxis type="number" tickFormatter={fmtShort} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={56} />
                  <Tooltip
                    formatter={(value) => [fmtCurrency(Number(value)), "金额"]}
                    labelFormatter={(label) => `分类：${label}`}
                  />
                  <Bar dataKey="value" name="金额" radius={[0, 4, 4, 0]}>
                    {data.categoryBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CAT_COLORS[index % CAT_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ====== 洞察卡片 ====== */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Calendar className="size-5 text-muted-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">日均支出</span>
              <span className="text-lg font-bold">{fmtCurrency(data.avgDaily)}</span>
              <span className="text-xs text-muted-foreground">当月共 {data.daysInMonth} 天</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <BarChart3 className="size-5 text-muted-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">交易笔数</span>
              <span className="text-lg font-bold">{thisM.count} 笔</span>
              <span className="text-xs text-muted-foreground">上月 {lastM.count} 笔</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
              <TrendingUp className="size-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">最高支出月</span>
              <span className="text-base font-bold truncate">
                {data.highestMonth ? `${data.highestMonth.month}` : "--"}
              </span>
              <span className="text-xs text-muted-foreground">
                {data.highestMonth ? fmtCurrency(data.highestMonth.expense) : "--"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
              <TrendingDown className="size-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">最低支出月</span>
              <span className="text-base font-bold truncate">
                {data.lowestMonth ? `${data.lowestMonth.month}` : "--"}
              </span>
              <span className="text-xs text-muted-foreground">
                {data.lowestMonth ? fmtCurrency(data.lowestMonth.expense) : "--"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
