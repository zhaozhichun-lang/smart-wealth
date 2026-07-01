"use client";

import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface Transaction {
  type: "income" | "expense";
  category: string;
  amount: string;
}

interface CategoryChartProps {
  transactions: Transaction[];
}

// 饼图颜色调色板
const COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#64748b", // slate
  "#14b8a6", // teal
];

/** 按支出分类聚合 */
function aggregateByCategory(transactions: Transaction[]) {
  const expenses = transactions.filter((tx) => tx.type === "expense");
  const categories: Record<string, number> = {};

  for (const tx of expenses) {
    const cat = tx.category || "未分类";
    categories[cat] = (categories[cat] || 0) + parseFloat(tx.amount || "0");
  }

  return Object.entries(categories)
    .map(([name, value]) => ({
      name,
      value: Math.round(value * 100) / 100,
    }))
    .sort((a, b) => b.value - a.value);
}

/** 自定义 Tooltip */
function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: { name: string; value: number } }>;
}) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0].payload;
  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-md text-sm">
      <p className="font-medium">{name}</p>
      <p className="text-muted-foreground">¥{value.toFixed(2)}</p>
    </div>
  );
}

/** 自定义 Legend 渲染 */
function renderLegend(props: {
  payload?: ReadonlyArray<{ value?: string; color?: string }>;
}) {
  const { payload } = props;
  if (!payload) return null;
  return (
    <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs">
      {payload.map((entry, i) => (
        <span key={entry.value || i} className="flex items-center gap-1.5">
          <span
            className="inline-block size-2 rounded-full shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground truncate max-w-20">
            {entry.value}
          </span>
        </span>
      ))}
    </div>
  );
}

export function CategoryChart({ transactions }: CategoryChartProps) {
  const data = useMemo(() => aggregateByCategory(transactions), [transactions]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
        暂无支出数据
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={52}
          outerRadius={92}
          paddingAngle={2}
          dataKey="value"
          nameKey="name"
        >
          {data.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={COLORS[index % COLORS.length]}
              stroke="none"
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend content={renderLegend} />
      </PieChart>
    </ResponsiveContainer>
  );
}
