import request from "./request";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export const coachApi = {
  /** 普通对话（一次性返回） */
  send: async (message: string): Promise<string> => {
    const result = await request.post("/api/aichat", { message });
    return result?.data || result?.reply || "暂无回复";
  },

  /** 流式对话（返回 ReadableStream 用于 SSE 读取） */
  sendStream: async (
    message: string,
    onChunk: (text: string) => void,
    onDone: () => void,
    onError: (error: string) => void,
  ): Promise<void> => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const response = await fetch("/api/aichat/stream", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      let detail = "流式请求失败";
      try {
        const err = await response.json();
        detail = err.message || detail;
      } catch { /* ignore */ }
      onError(detail);
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      onError("浏览器不支持流式读取");
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        // 最后一个可能是不完整的行，保留在 buffer 中
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;

          const data = trimmed.slice(6);
          if (data === "[DONE]") {
            continue;
          }

          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              onError(parsed.error);
              return;
            }
            if (parsed.content) {
              onChunk(parsed.content);
            }
          } catch {
            // 非 JSON 行，跳过
          }
        }
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : "流读取中断");
      return;
    }

    onDone();
  },
};
