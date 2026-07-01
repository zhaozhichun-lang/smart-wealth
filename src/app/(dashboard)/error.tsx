"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error boundary caught:", error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mb-2">
            <AlertTriangle className="size-8 text-destructive" />
          </div>
          <CardTitle className="text-xl font-bold">页面加载失败</CardTitle>
          <CardDescription>
            {error.message || "发生了意外错误，请重试。"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center gap-3">
          <Button onClick={reset} variant="outline" className="gap-2">
            <RefreshCw className="size-4" />
            重试
          </Button>
          <Button asChild className="gap-2">
            <Link href="/">
              <Home className="size-4" />
              返回首页
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
