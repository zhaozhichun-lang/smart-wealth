import { NextRequest } from "next/server";
import { getOpenAIClient, buildUserContext } from "@/lib/openai";
import { getCurrentUser, isGuest } from "@/lib/auth_utils";
import { ensureGuestDataFresh, checkGuestRateLimit } from "@/lib/guest";
import { chatMessageSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errResponse(message: string, status: number) {
  return new Response(JSON.stringify({ message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return errResponse("未登录或 token 已过期", 401);
  }

  // 游客 AI 频率限制 + 数据新鲜度
  if (isGuest(user)) {
    const rateCheck = checkGuestRateLimit(user.id);
    if (!rateCheck.allowed) {
      return errResponse(rateCheck.message!, 429);
    }
    await ensureGuestDataFresh(user.id);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errResponse("请求体格式错误", 400);
  }

  const parsed = chatMessageSchema.safeParse(body);
  if (!parsed.success) {
    return errResponse(parsed.error.issues[0]?.message || "消息不能为空", 400);
  }

  const { message } = parsed.data;

  const client = getOpenAIClient();
  if (!client) {
    return new Response(
      JSON.stringify({ message: "OpenAI 客户端未初始化" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const context = await buildUserContext(user.id);
  const systemPrompt =
    process.env.DEEPSEEK_SYSTEM_PROMPT || "You are a helpful assistant.";

  const prompt = `基于以下财务数据：${context}。用户的问题：${message}。请作为智能财务教练回答用户的问题，语气专业且鼓励人心。`;

  // 调用 OpenAI 流式接口
  const stream = await client.chat.completions.create({
    model: process.env.DEEPSEEK_MODEL || "deepseek-v4-flash",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ],
    stream: true,
  });

  // 构建 SSE 流响应
  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const delta = chunk.choices?.[0]?.delta?.content;
          if (delta) {
            // SSE 格式：data: <json>\n\n
            const sseChunk = `data: ${JSON.stringify({ content: delta })}\n\n`;
            controller.enqueue(encoder.encode(sseChunk));
          }
        }
        // 发送结束标记
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err) {
        console.error("流式响应中断:", err);
        const errorChunk = `data: ${JSON.stringify({ error: "生成回复时出错" })}\n\n`;
        controller.enqueue(encoder.encode(errorChunk));
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
