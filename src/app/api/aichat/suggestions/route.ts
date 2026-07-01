import { NextRequest, NextResponse } from "next/server";
import { getOpenAIClient, buildUserContext } from "@/lib/openai";
import { getCurrentUser, isGuest } from "@/lib/auth_utils";
import { ensureGuestDataFresh, checkGuestRateLimit } from "@/lib/guest";

// 获取 AI 智能财务建议
export async function GET(request: NextRequest) {
  // 验证当前用户是否登录
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
    const client = getOpenAIClient();
    if (!client) {
      return NextResponse.json(
        { message: "OpenAI 客户端未初始化" },
        { status: 500 },
      );
    }

    // 构建用户财务上下文
    const context = await buildUserContext(user.id);

    // 构建 prompt 提示词
    const prompt = `基于以下财务数据：${context}。
                         请给出一条简短的财务建议（50字以内），语气要专业且鼓励人心。`;

    const response = await client.chat.completions.create({
      model: process.env.DEEPSEEK_MODEL || "deepseek-v4-flash",
      messages: [
        {
          role: "system",
          content:
            process.env.DEEPSEEK_SYSTEM_PROMPT ||
            "You are a helpful assistant.",
        },
        { role: "user", content: prompt },
      ],
    });

    const suggestions = response.choices[0]?.message?.content || "暂无建议";

    return NextResponse.json({
      status: 200,
      message: "获取 AI 建议成功",
      suggestions,
    });
  } catch (error) {
    console.error("获取 AI 建议失败:", error);
    return NextResponse.json(
      { message: "获取 AI 建议失败" },
      { status: 500 },
    );
  }
}
