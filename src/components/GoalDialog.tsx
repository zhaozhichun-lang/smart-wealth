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
import { goalApi } from "@/lib/goal";

/** 外部传入的目标数据（编辑模式时使用） */
export interface GoalForEdit {
  id: number;
  title: string;
  target_amount: string;
  current_amount: string;
  deadline: string | null;
}

interface GoalDialogProps {
  /** 新增成功后的回调（刷新列表） */
  onSuccess?: () => void;
  /** 传入目标数据进入编辑模式；不传则为新增模式 */
  goal?: GoalForEdit | null;
  /** 编辑完成后清除编辑状态 */
  onEditClose?: () => void;
  /** 编辑成功后的回调：传入更新后的数据，由父组件就地更新列表 */
  onEditSuccess?: (updated: GoalForEdit) => void;
}

export function GoalDialog({
  onSuccess,
  goal,
  onEditClose,
  onEditSuccess,
}: GoalDialogProps) {
  const isEdit = !!goal;

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("0");
  const [deadline, setDeadline] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 标记是否正在主动关闭，防止 Radix 的 onOpenChange 回调干扰
  const isClosingRef = useRef(false);

  /** 当外部传入 goal 时，预填表单并打开弹窗 */
  useEffect(() => {
    if (goal) {
      isClosingRef.current = false;
      setTitle(goal.title);
      setTargetAmount(parseFloat(goal.target_amount).toString());
      setCurrentAmount(parseFloat(goal.current_amount).toString());
      setDeadline(goal.deadline || "");
      setOpen(true);
    }
  }, [goal]);

  const resetForm = () => {
    setTitle("");
    setTargetAmount("");
    setCurrentAmount("0");
    setDeadline("");
    setError(null);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (isClosingRef.current) {
      return;
    }
    setOpen(isOpen);
    if (isOpen) {
      if (!goal) {
        resetForm();
      }
    } else {
      onEditClose?.();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 表单验证
    const parsedTarget = parseFloat(targetAmount);
    const parsedCurrent = parseFloat(currentAmount) || 0;

    if (!title.trim()) {
      setError("请输入目标标题");
      return;
    }
    if (!targetAmount || isNaN(parsedTarget) || parsedTarget <= 0) {
      setError("请输入有效的目标金额");
      return;
    }
    if (isNaN(parsedCurrent) || parsedCurrent < 0) {
      setError("当前金额不能为负数");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEdit && goal) {
        // 编辑模式：先关闭弹窗再更新数据
        isClosingRef.current = true;
        onEditClose?.();
        setOpen(false);

        await goalApi.update(goal.id, {
          title: title.trim(),
          target_amount: parsedTarget,
          current_amount: parsedCurrent,
          deadline: deadline || undefined,
        });

        toast.success("目标修改成功", {
          description: `${title.trim()} · ¥${parsedTarget.toFixed(2)}`,
        });

        // 就地更新列表
        onEditSuccess?.({
          id: goal.id,
          title: title.trim(),
          target_amount: parsedTarget.toString(),
          current_amount: parsedCurrent.toString(),
          deadline: deadline || null,
        });
      } else {
        await goalApi.create({
          title: title.trim(),
          target_amount: parsedTarget,
          current_amount: parsedCurrent,
          deadline: deadline || undefined,
        });

        toast.success("目标创建成功", {
          description: `${title.trim()} · ¥${parsedTarget.toFixed(2)}`,
        });

        setOpen(false);
        onSuccess?.();
      }
    } catch (err) {
      isClosingRef.current = false;
      const msg =
        err instanceof Error ? err.message : "操作失败，请稍后重试";
      setError(msg);
      toast.error(isEdit ? "修改失败" : "创建失败", { description: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 计算进度百分比
  const progressPercent =
    targetAmount && parseFloat(targetAmount) > 0
      ? Math.min(
          100,
          Math.round((parseFloat(currentAmount || "0") / parseFloat(targetAmount)) * 100),
        )
      : 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!isEdit && (
        <DialogTrigger asChild>
          <Button>
            <PlusIcon />
            新增目标
          </Button>
        </DialogTrigger>
      )}

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "编辑储蓄目标" : "新增储蓄目标"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "修改目标信息，点击保存即可更新记录。"
              : "设定一个储蓄目标，开始你的财富之旅。"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4">
            {/* 标题 */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="goal-title">目标标题</Label>
              <Input
                id="goal-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例如：买房首付、旅行基金..."
              />
            </div>

            {/* 目标金额 + 当前金额 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="target-amount">目标金额</Label>
                <Input
                  id="target-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="current-amount">
                  当前已存 <span className="text-muted-foreground">（可选）</span>
                </Label>
                <Input
                  id="current-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* 进度预览 */}
            {targetAmount && parseFloat(targetAmount) > 0 && (
              <div className="flex flex-col gap-1.5 rounded-md bg-muted/50 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">进度预览</span>
                  <span className="font-medium">{progressPercent}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* 截止日期 */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="goal-deadline">
                截止日期 <span className="text-muted-foreground">（可选）</span>
              </Label>
              <Input
                id="goal-deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
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
