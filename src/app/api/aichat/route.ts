import { NextRequest, NextResponse } from "next/server";
import { getOpenAIClient, buildUserContext } from "@/lib/openai";
import { getCurrentUser, isGuest } from "@/lib/auth_utils";
import { ensureGuestDataFresh, checkGuestRateLimit } from "@/lib/guest";
import { chatMessageSchema } from "@/lib/validation";
import { parseBody } from "@/lib/api-utils";

// AI 智能财务教练对话
export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json(
      { message: "未登录或 token 已过期" },
      { status: 401 },
    );
  }

  // 游客 AI 频率限制 + 数据新鲜度
  if (isGuest(user)) {
    const rateCheck = checkGuestRateLimit(user.id);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { message: rateCheck.message },
        { status: 429 },
      );
    }
    await ensureGuestDataFresh(user.id);
  }

  try {
    const parsed = await parseBody(request, chatMessageSchema);
    if ("errorResponse" in parsed) return parsed.errorResponse;

    const { message } = parsed.data;

    const client = getOpenAIClient();
    if (!client) {
      return NextResponse.json(
        { message: "OpenAI 客户端未初始化" },
        { status: 500 },
      );
    }

    const context = await buildUserContext(user.id);
    const systemPrompt =
      process.env.DEEPSEEK_SYSTEM_PROMPT || "You are a helpful assistant.";

    const prompt = `基于以下财务数据：${context}。用户的问题：${message}。回答用户的问题。`;

    const response = await client.chat.completions.create({
      model: process.env.DEEPSEEK_MODEL || "deepseek-v4-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
    });

    const reply = response.choices[0]?.message?.content || "暂无建议";

    return NextResponse.json({
      message: "获取 AI 对话成功",
      data: reply,
    });
  } catch (error) {
    console.error("获取 AI 对话失败:", error);
    return NextResponse.json(
      { message: "获取 AI 对话失败" },
      { status: 500 },
    );
  }
}
