"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error boundary caught:", error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex min-h-screen items-center justify-center p-6">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mb-2">
                <AlertTriangle className="size-8 text-destructive" />
              </div>
              <CardTitle className="text-xl font-bold">页面出错了</CardTitle>
              <CardDescription>
                遇到了意外错误，请尝试刷新页面。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {error.digest && (
                <p className="text-xs text-muted-foreground font-mono">
                  Error ID: {error.digest}
                </p>
              )}
              <Button onClick={reset} className="gap-2">
                <RefreshCw className="size-4" />
                重试
              </Button>
            </CardContent>
          </Card>
        </div>
      </body>
    </html>
  );
}
