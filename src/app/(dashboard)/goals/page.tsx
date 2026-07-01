"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, PencilIcon, Trash2Icon, CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { goalApi } from "@/lib/goal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GoalDialog, GoalForEdit } from "@/components/GoalDialog";
import { useIsGuest } from "@/hooks/useIsGuest";

// 目标数据类型
interface Goal {
  id: number;
  user_id: number;
  title: string;
  target_amount: string;
  current_amount: string;
  deadline: string | null;
  create_at: string;
}

// 加载骨架屏
function GoalsSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-3 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-36 w-full" />
        ))}
      </div>
    </div>
  );
}

export default function Goals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 12;
  const isGuest = useIsGuest();

  const fetchGoals = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await goalApi.list(page, limit);
      setGoals(res.data);
      setTotalPages(res.totalPages);
      setTotal(res.total);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "获取目标列表失败，请稍后重试",
      );
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await goalApi.delete(id);
      setGoals((prev) => prev.filter((g) => g.id !== id));
      toast.success("目标删除成功");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "删除失败，请稍后重试";
      toast.error("删除失败", { description: msg });
      setConfirmId(null);
    } finally {
      setDeletingId(null);
    }
  };

  // 编辑成功后就地更新列表
  const handleEditSuccess = (updated: GoalForEdit) => {
    setGoals((prev) =>
      prev.map((g) =>
        g.id === updated.id
          ? {
              ...g,
              title: updated.title,
              target_amount: updated.target_amount,
              current_amount: updated.current_amount,
              deadline: updated.deadline,
            }
          : g,
      ),
    );
  };

  // 计算进度百分比
  const calcProgress = (current: string, target: string) => {
    const c = parseFloat(current) || 0;
    const t = parseFloat(target) || 1;
    return Math.min(100, Math.round((c / t) * 100));
  };

  // 计算剩余天数
  const calcRemainingDays = (deadline: string | null) => {
    if (!deadline) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const end = new Date(deadline);
    end.setHours(0, 0, 0, 0);
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // 格式化金额
  const formatAmount = (amount: string) => {
    return `¥${parseFloat(amount).toFixed(2)}`;
  };

  // 加载中
  if (isLoading) {
    return <GoalsSkeleton />;
  }

  // 错误状态
  if (error) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center gap-4 p-6">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-destructive">
              加载失败
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // 空状态
  if (goals.length === 0) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center p-6">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-xl font-bold">暂无储蓄目标</CardTitle>
            <CardDescription>
              设定你的第一个储蓄目标，开启财富积累之旅！
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isGuest && <GoalDialog onSuccess={fetchGoals} />}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">储蓄目标</h1>
        {!isGuest && (
          <GoalDialog
            onSuccess={fetchGoals}
            goal={editingGoal}
            onEditClose={() => setEditingGoal(null)}
            onEditSuccess={handleEditSuccess}
          />
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {goals.map((goal) => {
          const isHovered = hoveredId === goal.id;
          const isConfirming = confirmId === goal.id;
          const isDeleting = deletingId === goal.id;
          const progress = calcProgress(goal.current_amount, goal.target_amount);
          const remainingDays = calcRemainingDays(goal.deadline);

          // 进度条颜色
          const barColor =
            progress >= 100
              ? "bg-green-500"
              : progress >= 50
                ? "bg-primary"
                : "bg-amber-500";

          return (
            <Card
              key={goal.id}
              className={`cursor-pointer transition-all duration-200 ${
                isHovered ? "bg-accent shadow-md scale-[1.01]" : "shadow-sm"
              }`}
              onMouseEnter={() => setHoveredId(goal.id)}
              onMouseLeave={() => {
                setHoveredId(null);
                setConfirmId(null);
              }}
            >
              <CardContent className="flex flex-col gap-3 p-4">
                {/* 标题行 + 操作按钮 */}
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold truncate">{goal.title}</h3>

                  {/* 操作按钮区域 */}
                  {(isHovered || isConfirming) && !isGuest ? (
                    isConfirming ? (
                      <div className="flex shrink-0 items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmId(null);
                          }}
                        >
                          取消
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={isDeleting}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(goal.id);
                          }}
                        >
                          <Trash2Icon />
                          {isDeleting ? "删除中..." : "确认"}
                        </Button>
                      </div>
                    ) : (
                      <div className="flex shrink-0 items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingGoal(goal);
                          }}
                        >
                          <PencilIcon />
                          编辑
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmId(goal.id);
                          }}
                        >
                          <Trash2Icon />
                          删除
                        </Button>
                      </div>
                    )
                  ) : (
                    <span className="shrink-0 text-lg font-bold">
                      {progress}%
                    </span>
                  )}
                </div>

                {/* 进度条 */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {formatAmount(goal.current_amount)} /{" "}
                      {formatAmount(goal.target_amount)}
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* 底部信息 */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  {remainingDays !== null ? (
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="size-3" />
                      {remainingDays > 0
                        ? `剩余 ${remainingDays} 天`
                        : remainingDays === 0
                          ? "今天截止"
                          : `已超期 ${Math.abs(remainingDays)} 天`}
                    </span>
                  ) : (
                    <span>无截止日期</span>
                  )}
                  {progress >= 100 && (
                    <span className="font-medium text-green-600">🎉 已完成</span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ====== 分页 ====== */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="size-4" />
            上一页
          </Button>
          <span className="text-sm text-muted-foreground px-3">
            {page} / {totalPages}（共 {total} 个）
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            下一页
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
