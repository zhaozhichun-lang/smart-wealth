"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, User, Radio } from "lucide-react";
import { toast } from "sonner";
import { coachApi, ChatMessage } from "@/lib/coach";
import { Button } from "@/components/ui/button";

// 建议问题
const SUGGESTIONS = [
  "分析一下我这个月的支出情况",
  "我该如何优化预算？",
  "帮我制定一个储蓄计划",
  "我的消费习惯有什么问题？",
];

export default function CoachStream() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "你好！我是你的智能财务教练 💰（流式版）\n回复会实时逐字显示，体验更流畅。有什么想聊的？",
    },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // 自动滚动到底部
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 发送消息（流式）
  const handleSend = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || isStreaming) return;

    const userMsg: ChatMessage = { role: "user", content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsStreaming(true);

    // 先插入一个空的 assistant 占位消息
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    await coachApi.sendStream(
      msg,
      // onChunk：追加文本到最后一个 assistant 消息
      (chunk: string) => {
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last && last.role === "assistant") {
            updated[updated.length - 1] = {
              ...last,
              content: last.content + chunk,
            };
          }
          return updated;
        });
      },
      // onDone：流结束
      () => {
        setIsStreaming(false);
      },
      // onError
      (error: string) => {
        toast.error("流式回复失败", { description: error });
        // 把占位消息替换为错误提示
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last && last.role === "assistant" && !last.content) {
            updated[updated.length - 1] = {
              ...last,
              content: "抱歉，回复生成失败，请稍后重试。",
            };
          }
          return updated;
        });
        setIsStreaming(false);
      },
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 是否正在接收最后一个助手消息的流
  const lastMsg = messages[messages.length - 1];
  const isReceiving = isStreaming && lastMsg?.role === "assistant";

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)] p-6">
      <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Radio className="size-6 text-primary" />
        智能教练（流式）
        {isReceiving && (
          <span className="text-xs font-normal text-muted-foreground animate-pulse ml-2">
            ● 接收中...
          </span>
        )}
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
              {/* 流式光标 */}
              {isReceiving && i === messages.length - 1 && (
                <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 animate-pulse align-text-bottom" />
              )}
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* 建议问题（仅首次） */}
      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {SUGGESTIONS.map((s) => (
            <Button
              key={s}
              variant="outline"
              size="sm"
              onClick={() => handleSend(s)}
              disabled={isStreaming}
            >
              {s}
            </Button>
          ))}
        </div>
      )}

      {/* 输入框 */}
      <div className="flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入你的财务问题...（流式回复）"
          rows={2}
          disabled={isStreaming}
          className="flex-1 resize-none rounded-xl border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
        />
        <Button
          onClick={() => handleSend()}
          disabled={!input.trim() || isStreaming}
          className="h-auto rounded-xl px-4"
        >
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}
