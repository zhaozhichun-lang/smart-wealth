"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, User } from "lucide-react";
import { toast } from "sonner";
import { coachApi, ChatMessage } from "@/lib/coach";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// 建议问题
const SUGGESTIONS = [
  "分析一下我这个月的支出情况",
  "我该如何优化预算？",
  "帮我制定一个储蓄计划",
  "我的消费习惯有什么问题？",
];

export default function Coach() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "你好！我是你的智能财务教练 💰\n我可以帮你分析收支情况、优化预算、制定储蓄计划。有什么想聊的？",
    },
  ]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 发送消息
  const handleSend = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || isThinking) return;

    const userMsg: ChatMessage = { role: "user", content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsThinking(true);

    try {
      const reply = await coachApi.send(msg);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "回复失败";
      toast.error("AI 回复失败", { description: errMsg });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "抱歉，我暂时无法回复，请稍后重试。" },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)] p-6">
      <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Sparkles className="size-6 text-primary" />
        智能教练
      </h1>

      {/* 聊天区域 */}
      <div className="flex-1 overflow-y-auto rounded-xl border bg-muted/30 p-4 space-y-4 mb-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            {/* 头像 */}
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm ${
                msg.role === "assistant"
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {msg.role === "assistant" ? <Sparkles className="size-4" /> : <User className="size-4" />}
            </div>
            {/* 气泡 */}
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background border"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* 思考中动画 */}
        {isThinking && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="size-4" />
            </div>
            <div className="flex items-center gap-1 rounded-2xl border bg-background px-4 py-3">
              <span className="size-2 animate-bounce rounded-full bg-primary/40 [animation-delay:0ms]" />
              <span className="size-2 animate-bounce rounded-full bg-primary/40 [animation-delay:150ms]" />
              <span className="size-2 animate-bounce rounded-full bg-primary/40 [animation-delay:300ms]" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* 建议问题（仅首次） */}
      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {SUGGESTIONS.map((s) => (
            <Button key={s} variant="outline" size="sm" onClick={() => handleSend(s)} disabled={isThinking}>
              {s}
            </Button>
          ))}
        </div>
      )}

      {/* 输入框 */}
      <div className="flex gap-2">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入你的财务问题..."
          rows={2}
          disabled={isThinking}
          className="flex-1 resize-none rounded-xl border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
        />
        <Button
          onClick={() => handleSend()}
          disabled={!input.trim() || isThinking}
          className="h-auto rounded-xl px-4"
        >
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}
