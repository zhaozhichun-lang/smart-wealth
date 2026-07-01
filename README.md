智能财务教练
项目简介
一个面向个人的智能财务管理平台，支持收支记录、储蓄目标追踪，并集成 AI 对话教练提供个性化财务建议。前后端全栈使用 TypeScript 构建。

技术栈  
TypeScript +Next.js 16 (App Router) + shadcn/ui + Tailwind CSS + Recharts
Drizzle ORM + drizzle-kit + PostgreSQL + JWT(jose) + bcrypt
DeepSeek API (OpenAI SDK)
Turbopack工程化构建工具

全栈开发：
独立完成从数据库设计、API 开发到前端页面的完整全栈项目

后端：基于 Drizzle ORM 设计 业务表（用户/交易/目标），实现 JWT 注册登录鉴权、交易 CRUD、储蓄目标 CRUD 等 RESTful 接口，并通过聚合查询 + Prompt Engineering 集成 DeepSeek API 实现 AI 财务教练对话

前端：使用 shadcn/ui 搭建响应式仪表盘，包含带分类映射的 CRUD 交易表格、进度条目标卡片网格、Recharts 统计图表，以及消息气泡式 AI 聊天界面
