"use client";

import { useEffect, useRef, useState } from "react";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { transactionApi } from "@/lib/transaction";

// 常见分类
const CATEGORIES = [
  "餐饮",
  "交通",
  "购物",
  "娱乐",
  "住房",
  "医疗",
  "教育",
  "工资",
  "投资",
  "其他",
];

/** 外部传入的交易数据（编辑模式时使用） */
export interface TransactionForEdit {
  id: number;
  type: "income" | "expense";
  category: string;
  amount: string;
  date: string;
  description: string | null;
  source: string | null;
}

interface AddTransactionDialogProps {
  /** 新增成功后的回调（刷新列表） */
  onSuccess?: () => void;
  /** 传入交易数据进入编辑模式；不传则为新增模式 */
  transaction?: TransactionForEdit | null;
  /** 编辑完成后清除编辑状态 */
  onEditClose?: () => void;
  /** 编辑成功后的回调：传入更新后的数据，由父组件就地更新列表 */
  onEditSuccess?: (updated: TransactionForEdit) => void;
}

export function AddTransactionDialog({
  onSuccess,
  transaction,
  onEditClose,
  onEditSuccess,
}: AddTransactionDialogProps) {
  const isEdit = !!transaction;

  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"income" | "expense">("expense");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [source, setSource] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 标记是否正在主动关闭，防止 useEffect 重新打开弹窗
  const isClosingRef = useRef(false);

  /** 当外部传入 transaction 时，预填表单并打开弹窗 */
  useEffect(() => {
    if (transaction) {
      // 新的编辑请求到来，重置关闭标记
      isClosingRef.current = false;
      setType(transaction.type);
      setCategory(transaction.category);
      setAmount(parseFloat(transaction.amount).toString());
      setDate(transaction.date);
      setDescription(transaction.description || "");
      setSource(transaction.source || "");
      setOpen(true);
    }
  }, [transaction]);

  const resetForm = () => {
    setType("expense");
    setCategory("");
    setAmount("");
    setDate(new Date().toISOString().split("T")[0]);
    setDescription("");
    setSource("");
    setError(null);
  };

  const handleOpenChange = (isOpen: boolean) => {
    // 如果正在主动关闭中，忽略 Radix 触发的回调
    if (isClosingRef.current) {
      return;
    }
    setOpen(isOpen);
    if (isOpen) {
      if (!transaction) {
        resetForm();
      }
    } else {
      // 用户手动关闭弹窗（点遮罩/按ESC/点X）
      onEditClose?.();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 表单验证
    const parsedAmount = parseFloat(amount);
    if (!category.trim()) {
      setError("请选择或输入分类");
      return;
    }
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("请输入有效的金额");
      return;
    }
    if (!date) {
      setError("请选择日期");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEdit && transaction) {
        // 编辑模式：先关闭弹窗再更新数据，避免 useEffect 干扰
        isClosingRef.current = true;
        onEditClose?.();
        setOpen(false);

        await transactionApi.update(transaction.id, {
          type,
          category: category.trim(),
          amount: parsedAmount,
          date,
          description: description.trim() || undefined,
          source: source.trim() || undefined,
        });

        toast.success("交易修改成功", {
          description: `${type === "income" ? "收入" : "支出"} · ${category.trim()} · ¥${parsedAmount.toFixed(2)}`,
        });

        // 就地更新列表，避免整表刷新导致排序跳动
        onEditSuccess?.({
          id: transaction.id,
          type,
          category: category.trim(),
          amount: parsedAmount.toString(),
          date,
          description: description.trim() || null,
          source: source.trim() || null,
        });
      } else {
        await transactionApi.create({
          type,
          category: category.trim(),
          amount: parsedAmount,
          date,
          description: description.trim() || undefined,
          source: source.trim() || undefined,
        });

        toast.success("交易添加成功", {
          description: `${type === "income" ? "收入" : "支出"} · ${category.trim()} · ¥${parsedAmount.toFixed(2)}`,
        });

        setOpen(false);
        onSuccess?.();
      }
    } catch (err) {
      // 编辑失败时重置关闭标记，允许用户重试
      isClosingRef.current = false;
      const msg =
        err instanceof Error ? err.message : "操作失败，请稍后重试";
      setError(msg);
      toast.error(isEdit ? "修改失败" : "新增失败", { description: msg });
    } finally {
      setIsSubmitting(false);
      if (!isEdit) {
        // 新增模式的关闭标记在请求期间不需要
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {/* 编辑模式不显示触发器按钮（由外部控制打开） */}
      {!isEdit && (
        <DialogTrigger asChild>
          <Button>
            <PlusIcon />
            新增交易
          </Button>
        </DialogTrigger>
      )}

      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "编辑交易" : "新增交易"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "修改交易信息，点击保存即可更新记录。"
              : "填写交易信息，点击保存即可添加一条新记录。"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4">
            {/* 类型选择 */}
            <div className="flex flex-col gap-1.5">
              <Label>类型</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={type === "expense" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setType("expense")}
                >
                  支出
                </Button>
                <Button
                  type="button"
                  variant={type === "income" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setType("income")}
                >
                  收入
                </Button>
              </div>
            </div>

            {/* 分类 */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="category">分类</Label>
              <Input
                id="category"
                list="category-list"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="例如：餐饮、交通..."
              />
              <datalist id="category-list">
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>

            {/* 金额 */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="amount">金额</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>

            {/* 日期 */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="date">日期</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            {/* 描述 */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">
                描述 <span className="text-muted-foreground">（可选）</span>
              </Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="备注信息..."
              />
            </div>

            {/* 来源 */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="source">
                来源 <span className="text-muted-foreground">（可选）</span>
              </Label>
              <Input
                id="source"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="例如：支付宝、微信..."
              />
            </div>

            {/* 错误提示 */}
            {error && (
              <p className="text-sm font-medium text-destructive">{error}</p>
            )}
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                // 编辑模式下先清除外部编辑状态，再关闭弹窗
                if (isEdit) {
                  onEditClose?.();
                }
                setOpen(false);
              }}
            >
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
