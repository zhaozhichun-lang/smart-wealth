"use client";

import { useCallback, useEffect, useState } from "react";
import { User, Mail, Lock, Save, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { dashboardApi, CurrentUser } from "@/lib/dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useIsGuest } from "@/hooks/useIsGuest";

function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-6 max-w-2xl">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-48 w-full rounded-xl" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}

export default function Profile() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isGuest = useIsGuest();

  // 昵称编辑
  const [name, setName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);

  // 密码修改
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPwd, setIsSavingPwd] = useState(false);

  const fetchUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await dashboardApi.getCurrentUser();
      setUser(data);
      setName(data.name || "");
    } catch (err) {
      toast.error("获取用户信息失败");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // 保存昵称
  const handleSaveName = async () => {
    if (!name.trim()) {
      toast.error("昵称不能为空");
      return;
    }
    if (name.trim() === user?.name) {
      toast("昵称未更改");
      return;
    }
    setIsSavingName(true);
    try {
      const updated = await dashboardApi.updateProfile({ name: name.trim() });
      setUser(updated);
      // 同步更新 localStorage 中的 loginInfo
      const loginInfo = localStorage.getItem("loginInfo");
      if (loginInfo) {
        try {
          const parsed = JSON.parse(loginInfo);
          parsed.name = updated.name;
          localStorage.setItem("loginInfo", JSON.stringify(parsed));
        } catch { /* ignore */ }
      }
      toast.success("昵称已更新");
    } catch (err) {
      toast.error("更新失败", { description: err instanceof Error ? err.message : "未知错误" });
    } finally {
      setIsSavingName(false);
    }
  };

  // 修改密码
  const handleChangePassword = async () => {
    if (!currentPassword) {
      toast.error("请输入当前密码");
      return;
    }
    if (!newPassword) {
      toast.error("请输入新密码");
      return;
    }
    if (newPassword.length < 8 || newPassword.length > 20) {
      toast.error("新密码长度必须在 8-20 位之间");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("两次输入的密码不一致");
      return;
    }
    setIsSavingPwd(true);
    try {
      await dashboardApi.updateProfile({
        currentPassword,
        newPassword,
      });
      toast.success("密码已更新，请重新登录");
      // 清除登录状态跳转
      setTimeout(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("loginInfo");
        window.location.href = "/login";
      }, 1200);
    } catch (err) {
      toast.error("修改失败", { description: err instanceof Error ? err.message : "未知错误" });
    } finally {
      setIsSavingPwd(false);
    }
  };

  if (isLoading) return <ProfileSkeleton />;

  return (
    <div className="flex flex-col gap-6 p-6 max-w-2xl">
      <h1 className="text-2xl font-bold">个人资料</h1>

      {/* ====== 基本信息 ====== */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="size-4" /> 基本信息
          </CardTitle>
          <CardDescription>你的账户基本信息</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 邮箱（只读） */}
          <div className="flex flex-col gap-1.5">
            <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Mail className="size-3" /> 邮箱
            </Label>
            <Input value={user?.email || ""} disabled className="opacity-60" />
            <p className="text-xs text-muted-foreground">邮箱暂不支持修改</p>
          </div>

          <Separator />

          {/* 昵称（可编辑） */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name" className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <User className="size-3" /> 昵称
            </Label>
            <div className="flex gap-2">
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="输入你的昵称"
              />
              {!isGuest && (
                <Button onClick={handleSaveName} disabled={isSavingName}>
                  <Save className="size-4" />
                  {isSavingName ? "保存中..." : "保存"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ====== 修改密码 ====== */}
      {!isGuest && (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="size-4" /> 修改密码
          </CardTitle>
          <CardDescription>更新你的登录密码</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="current-pwd" className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <KeyRound className="size-3" /> 当前密码
            </Label>
            <Input
              id="current-pwd"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="输入当前密码"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-pwd" className="text-xs text-muted-foreground">
              新密码
            </Label>
            <Input
              id="new-pwd"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="8-20 位新密码"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirm-pwd" className="text-xs text-muted-foreground">
              确认新密码
            </Label>
            <Input
              id="confirm-pwd"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="再次输入新密码"
            />
          </div>

          <Button onClick={handleChangePassword} disabled={isSavingPwd} className="w-full">
            <Lock className="size-4" />
            {isSavingPwd ? "修改中..." : "修改密码"}
          </Button>

          <p className="text-xs text-muted-foreground">
            修改密码后将自动退出登录，请使用新密码重新登录。
          </p>
        </CardContent>
      </Card>
      )}
    </div>
  );
}
