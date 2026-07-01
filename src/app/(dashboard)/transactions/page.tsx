"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, PencilIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { transactionApi } from "@/lib/transaction";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AddTransactionDialog, TransactionForEdit } from "@/components/AddTransactionDialog";
import { useIsGuest } from "@/hooks/useIsGuest";

// 交易数据类型
interface Transaction {
  id: number;
  user_id: number;
  type: "income" | "expense";
  category: string;
  amount: string;
  date: string;
  description: string | null;
  source: string | null;
  create_at: string;
}

// 加载骨架屏
function TransactionsSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <Skeleton className="h-8 w-48" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    </div>
  );
}

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;
  const isGuest = useIsGuest();

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await transactionApi.list(page, limit);
      setTransactions(res.data);
      setTotalPages(res.totalPages);
      setTotal(res.total);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "获取交易列表失败，请稍后重试"
      );
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await transactionApi.delete(id);
      // 从列表中移除该条记录
      setTransactions((prev) => prev.filter((tx) => tx.id !== id));
      toast.success("交易删除成功");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "删除失败，请稍后重试";
      toast.error("删除失败", { description: msg });
      setConfirmId(null);
    } finally {
      setDeletingId(null);
    }
  };

  // 编辑成功后就地更新列表，避免整表刷新导致排序跳动
  const handleEditSuccess = (updated: TransactionForEdit) => {
    setTransactions((prev) => {
      const replaced = prev.map((tx) =>
        tx.id === updated.id
          ? {
              ...tx,
              type: updated.type,
              category: updated.category,
              amount: updated.amount,
              date: updated.date,
              description: updated.description,
              source: updated.source,
            }
          : tx,
      );
      // 按日期降序重排（若日期未变则顺序不变，若日期变了则移到正确位置）
      return replaced.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
    });
  };

  // 加载中
  if (isLoading) {
    return <TransactionsSkeleton />;
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
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center p-6">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-xl font-bold">暂无交易记录</CardTitle>
            <CardDescription>
              您目前还没有任何交易记录，快去添加一笔吧！
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isGuest && (
              <AddTransactionDialog
                onSuccess={fetchTransactions}
                transaction={editingTransaction}
                onEditClose={() => setEditingTransaction(null)}
                onEditSuccess={handleEditSuccess}
              />
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // 格式化金额
  const formatAmount = (amount: string, type: "income" | "expense") => {
    const num = parseFloat(amount);
    const prefix = type === "income" ? "+" : "-";
    return `${prefix}¥${Math.abs(num).toFixed(2)}`;
  };

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">交易记录</h1>
        {!isGuest && (
          <AddTransactionDialog
            onSuccess={fetchTransactions}
            transaction={editingTransaction}
            onEditClose={() => setEditingTransaction(null)}
            onEditSuccess={handleEditSuccess}
          />
        )}
      </div>

      <div className="grid gap-3">
        {transactions.map((tx) => {
          const isHovered = hoveredId === tx.id;
          const isConfirming = confirmId === tx.id;
          const isDeleting = deletingId === tx.id;

          return (
            <Card
              key={tx.id}
              className={`cursor-pointer transition-all duration-200 ${
                isHovered
                  ? "bg-accent shadow-md scale-[1.01]"
                  : "shadow-sm"
              }`}
              onMouseEnter={() => setHoveredId(tx.id)}
              onMouseLeave={() => {
                setHoveredId(null);
                setConfirmId(null);
              }}
            >
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg ${
                      tx.type === "income"
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {tx.type === "income" ? "💰" : "💸"}
                  </div>

                  <div className="flex flex-col min-w-0">
                    <span className="font-medium">{tx.category}</span>
                    <span className="text-sm text-muted-foreground truncate">
                      {tx.description || "无描述"}
                    </span>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span>{tx.date}</span>
                      {tx.source && <span>来源: {tx.source}</span>}
                    </div>
                  </div>
                </div>

                {(isHovered || isConfirming) && !isGuest ? (
                  isConfirming ? (
                    <div className="flex shrink-0 items-center gap-1.5 transition-all duration-150">
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
                          handleDelete(tx.id);
                        }}
                      >
                        <Trash2Icon />
                        {isDeleting ? "删除中..." : "确认"}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex shrink-0 items-center gap-1.5 transition-all duration-150">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTransaction(tx);
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
                          setConfirmId(tx.id);
                        }}
                      >
                        <Trash2Icon />
                        删除
                      </Button>
                    </div>
                  )
                ) : (
                  <span
                    className={`shrink-0 text-lg font-semibold ${
                      tx.type === "income" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {formatAmount(tx.amount, tx.type)}
                  </span>
                )}
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
            {page} / {totalPages}（共 {total} 条）
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
