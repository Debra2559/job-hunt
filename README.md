<h1 align="center">AI 职业规划助手</h1>

<p align="center">
  <b>智联招聘 × 扣子 黑客松参赛作品 —— 基于 GCDF / BCC 方法论的 AI 求职与职业规划 Agent。</b>
</p>

<p align="center">
  <a href="https://ai-counselor.top">
    <img src="https://img.shields.io/badge/🚀%20%E7%82%B9%E6%AD%A4%E5%9C%A8%E7%BA%BF%E4%BD%93%E9%AA%8C-ai--counselor.top-10b981?style=for-the-badge&labelColor=064e3b&logoColor=white" alt="点此在线体验 ai-counselor.top" height="64" />
  </a>
  <br/>
  <sub>🟢 已上线 · 免注册即可试用 · 支持 PC / 手机 / PWA 安装</sub>
</p>

<p align="center">
  <img src="public/pwa-icon-512.png" alt="AI 职业规划助手" width="120" />
</p>

---

## 🏆 关于本作品

本项目是参加 **智联招聘 × 扣子（Coze）联合举办的 AI 黑客松** 的参赛作品，赛道聚焦 **AI × 求职**。

我们希望用一个会"聊"、会"听"、会"出报告"的 AI 求职顾问，帮助求职者：

* 🎯 **想清楚自己**：8-12 轮深度对话，挖掘兴趣、能力、价值观
* 📊 **看清楚自己**：自动生成 SVG 能力雷达图与个性化职业建议
* 🚀 **找到下一步**：一键跳转 **智联招聘 / BOSS 直聘** 等平台精准搜索匹配岗位

## ✨ 核心功能

| 模块 | 说明 |
|---|---|
| 🎓 职业规划 Agent | 基于 **GCDF（全球职业规划师）/ BCC（生涯教练）** 方法论的 8-12 轮深度对话 |
| 📈 能力雷达图 | 对话结束后自动生成 SVG 雷达图，可视化展示候选人多维能力 |
| 📝 个性化报告 | 输出岗位推荐、发展路径、技能补齐建议的结构化报告 |
| 🔗 求职平台直达 | 一键根据画像跳转智联招聘 / BOSS 直聘搜索匹配岗位 |
| 💬 SSE 流式对话 | 边想边答，移动端胶囊式输入框 + 语音输入（Web Speech API） |
| 📱 PWA 支持 | 可"添加到主屏幕"，移动端体验接近原生 App |

## 🤖 技术亮点

* **方法论驱动**：Agent 的 system prompt 与对话编排严格基于 GCDF / BCC 职业咨询框架，而非泛泛闲聊
* **严格 grounding**：所有专业建议均基于知识库检索，避免幻觉
* **结构化输出**：长对话自动归纳为可视化报告（SVG 雷达图 + 文本建议）
* **零门槛体验**：免注册即可使用，对话记录本地持久化

## 🛠 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18 · Vite 5 · TypeScript 5 · Tailwind CSS 3 · shadcn/ui · Framer Motion |
| 后端 | Lovable Cloud (Supabase) · PostgreSQL · Edge Functions |
| AI | Lovable AI Gateway（Gemini / GPT 系列） · SSE 流式输出 |
| 可视化 | 手写 SVG 雷达图 |
| 部署 | Lovable · 自定义域名 `ai-counselor.top` |

## 🚀 快速开始

```bash
git clone <your-repo-url>
cd ai-career-agent
npm install
npm run dev   # http://localhost:8080
```

> 后端（数据库 / Edge Functions）通过 Lovable Cloud 自动开通，无需手动配置。

## 📂 项目结构

```
src/
├── components/career/   # 职业规划报告与雷达图
├── hooks/useCareerConversation.ts   # 对话状态管理
├── pages/Career.tsx     # 主页面
└── integrations/supabase/   # 自动生成，请勿手动修改

supabase/functions/
└── career-agent/        # 职业规划 Agent（GCDF/BCC 编排 + SSE）
```

## 📄 License

MIT © AI Career Agent · 智联 × 扣子 黑客松参赛作品
