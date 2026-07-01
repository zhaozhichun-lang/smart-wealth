"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface Transaction {
  type: "income" | "expense";
  category: string;
  amount: string;
  date: string;
}

interface TrendChartProps {
  transactions: Transaction[];
}

/** 按月份分组并聚合收入/支出 */
function aggregateByMonth(transactions: Transaction[]) {
  const months: Record<string, { income: number; expense: number }> = {};

  for (const tx of transactions) {
    // date 格式 "YYYY-MM-DD"，取前 7 位为月
    const month = tx.date.slice(0, 7);
    if (!months[month]) {
      months[month] = { income: 0, expense: 0 };
    }
    const amount = parseFloat(tx.amount) || 0;
    if (tx.type === "income") {
      months[month].income += amount;
    } else {
      months[month].expense += amount;
    }
  }

  // 转为数组并按月份升序
  return Object.entries(months)
    .map(([month, val]) => ({
      month,
      income: Math.round(val.income * 100) / 100,
      expense: Math.round(val.expense * 100) / 100,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

/** 格式化金额（短格式） */
function formatShort(amount: number): string {
  if (amount >= 10000) {
    return `${(amount / 10000).toFixed(1)}万`;
  }
  return `¥${amount.toFixed(0)}`;
}

/** 自定义 Tooltip */
function CustomTooltip({
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
          <span
            className="inline-block size-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          {entry.name === "income" ? "收入" : "支出"}：¥{entry.value.toFixed(2)}
        </p>
      ))}
    </div>
  );
}

export function TrendChart({ transactions }: TrendChartProps) {
  const data = useMemo(() => aggregateByMonth(transactions), [transactions]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
        暂无交易数据
      </div>
    );
  }

  // 单月数据直接用一条线，但纯展示仍可用
  if (data.length === 1) {
    // 补一个虚拟月份使 X 轴不显孤立
    data.unshift({
      month: "",
      income: 0,
      expense: 0,
    });
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          className="text-muted-foreground"
        />
        <YAxis
          tickFormatter={formatShort}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={52}
          className="text-muted-foreground"
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value: string) => (value === "income" ? "收入" : "支出")}
        />
        <Line
          type="monotone"
          dataKey="income"
          stroke="#22c55e"
          strokeWidth={2}
          dot={{ r: 3, strokeWidth: 1 }}
          activeDot={{ r: 5 }}
          name="income"
        />
        <Line
          type="monotone"
          dataKey="expense"
          stroke="#ef4444"
          strokeWidth={2}
          dot={{ r: 3, strokeWidth: 1 }}
          activeDot={{ r: 5 }}
          name="expense"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
