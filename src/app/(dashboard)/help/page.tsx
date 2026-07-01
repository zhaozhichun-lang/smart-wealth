"use client";

import { useState } from "react";
import {
  ChevronDown,
  HelpCircle,
  BookOpen,
  Lightbulb,
  Mail,
  ArrowRightLeft,
  Target,
  PieChart,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// ====== FAQ 数据 ======

interface FaqItem {
  q: string;
  a: string;
}

const FAQS: FaqItem[] = [
  {
    q: "如何添加一笔交易？",
    a: "进入「交易管理」页面，点击右上角「新增交易」按钮，填写类型（收入/支出）、分类、金额、日期等信息后保存即可。也可以在首页的「最近交易」卡片中快速添加。",
  },
  {
    q: "如何设定储蓄目标？",
    a: "进入「储蓄目标」页面，点击右上角「新增目标」按钮，填写目标标题、目标金额、当前已存金额和截止日期后保存。系统会自动计算完成进度。",
  },
  {
    q: "预算分析数据从哪来？",
    a: "预算分析基于你所有已录入的交易记录自动计算，包括月度收支趋势、支出分类占比、环比变化等。数据越多，分析越精准。",
  },
  {
    q: "智能教练能做什么？",
    a: "智能教练基于你的真实财务数据（收入、支出、储蓄目标），结合 AI 大模型为你提供个性化的财务建议。你可以问它如何优化支出、制定储蓄计划、分析消费习惯等。",
  },
  {
    q: "流式版和普通版智能教练有什么区别？",
    a: "普通版等待 AI 生成完整回复后一次性显示；流式版会实时逐字显示回复内容，体验更流畅。两者功能完全相同，你可以根据喜好选择。",
  },
  {
    q: "我的数据安全吗？",
    a: "你的财务数据存储在安全的 PostgreSQL 数据库中，密码经过加密处理，API 请求使用 JWT Token 认证。我们不会将你的数据分享给第三方。",
  },
  {
    q: "忘记密码怎么办？",
    a: "当前版本暂不支持自助找回密码。如需重置密码，请联系系统管理员或使用其他已注册邮箱重新注册。",
  },
  {
    q: "如何切换深色/浅色主题？",
    a: "进入「设置」页面，在「外观主题」中选择浅色、深色或跟随系统即可。也可以点击侧边栏底部的用户菜单快速切换。",
  },
];

// ====== 快速入门 ======

const GUIDES = [
  {
    icon: ArrowRightLeft,
    title: "交易管理",
    desc: "记录每一笔收入和支出",
    href: "/transactions",
  },
  {
    icon: Target,
    title: "储蓄目标",
    desc: "设定并追踪财务目标",
    href: "/goals",
  },
  {
    icon: PieChart,
    title: "预算分析",
    desc: "查看消费趋势与洞察",
    href: "/budgets",
  },
  {
    icon: MessageCircle,
    title: "智能教练",
    desc: "AI 驱动的财务建议",
    href: "/coach",
  },
];

// ====== 小贴士 ======

const TIPS = [
  "💡 养成每天记录交易的习惯，数据越完整分析越准确。",
  "💡 为每笔交易添加「描述」和「来源」，方便后续回顾。",
  "💡 设定一个可达成的储蓄目标，逐步培养储蓄习惯。",
  "💡 定期查看「预算分析」页面，了解消费趋势变化。",
  "💡 遇到财务疑惑？随时问智能教练，它会基于你的真实数据给出建议。",
  "💡 支出分类越详细，饼图分析越有价值。",
];

// ====== 组件 ======

function FaqSection({ item, isOpen, onToggle }: { item: FaqItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b last:border-0">
      <button
        className="flex w-full items-center justify-between py-3 text-left text-sm font-medium hover:text-primary transition-colors"
        onClick={onToggle}
      >
        <span>{item.q}</span>
        <ChevronDown
          className={`size-4 shrink-0 text-muted-foreground transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && (
        <p className="pb-3 text-sm text-muted-foreground leading-relaxed">
          {item.a}
        </p>
      )}
    </div>
  );
}

// ====== 主页面 ======

export default function HelpCenter() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="flex flex-col gap-6 p-6 max-w-2xl">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <HelpCircle className="size-6 text-primary" />
        帮助中心
      </h1>

      {/* ====== 快速入门 ====== */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="size-4" /> 快速入门
          </CardTitle>
          <CardDescription>了解 Smart-Wealth 的核心功能</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {GUIDES.map((g) => (
              <Button key={g.href} variant="outline" className="flex-col gap-2 h-auto py-4" asChild>
                <Link href={g.href}>
                  <g.icon className="size-6 text-primary" />
                  <span className="text-sm font-medium">{g.title}</span>
                  <span className="text-xs text-muted-foreground">{g.desc}</span>
                </Link>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ====== 常见问题 FAQ ====== */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <HelpCircle className="size-4" /> 常见问题
          </CardTitle>
          <CardDescription>关于使用 Smart-Wealth 的常见疑问</CardDescription>
        </CardHeader>
        <CardContent>
          {FAQS.map((item, i) => (
            <FaqSection
              key={i}
              item={item}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </CardContent>
      </Card>

      {/* ====== 使用小贴士 ====== */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="size-4" /> 使用小贴士
          </CardTitle>
          <CardDescription>提升财务管理效率的小技巧</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {TIPS.map((tip, i) => (
              <li key={i} className="text-sm text-muted-foreground leading-relaxed">
                {tip}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* ====== 联系我们 ====== */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="size-4" /> 联系我们
          </CardTitle>
          <CardDescription>
            如有其他问题或建议，欢迎通过以下方式联系我们
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>📧 邮箱：support@smart-wealth.com</p>
          <p>💬 反馈：在智能教练中直接描述你的问题或建议，我们会持续改进产品。</p>
        </CardContent>
      </Card>
    </div>
  );
}
