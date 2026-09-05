# AI 全栈学习博客

一个边学边写的 AI 原生全栈博客项目——从 0 到 1 完整走通「前端 + 后台管理 + 后端 + 数据库」，记录踩过的坑，最终目标是可独立上线交付。

## 技术栈

| 层 | 技术 |
|---|---|
| 框架 | Next.js 16（App Router）+ React 19 |
| 语言 | TypeScript |
| 样式 | Tailwind CSS v4（设计令牌 + 暗色主题） |
| 数据库 | PostgreSQL 17（Docker）+ Prisma 7 |
| 鉴权 | 密码（scrypt）+ 极验 GeeTest v4 + 签名 Cookie 会话 |

## 功能

- 文章 CRUD + Markdown 渲染（react-markdown）
- 登录鉴权：用户名密码 + 极验滑块，`proxy.ts` 保护后台，写操作硬闸门
- 标签分类 + 标题搜索 + 分页
- 首页精选大卡 + 暗色主题 + 阅读进度条
- SSG/ISR 静态化、SEO（sitemap / robots / RSS）、自定义 404

## 快速开始

```bash
# 1. 起数据库（Docker）
docker compose up -d

# 2. 装依赖（Node ≥ 20.9，pnpm）
pnpm install

# 3. 配环境变量
cp .env.example .env   # 填入 DATABASE_URL / SESSION_SECRET 等

# 4. 建表（迁移）+ 生成 Prisma 客户端
pnpm exec prisma migrate dev
pnpm exec prisma generate

# 5. 跑起来
pnpm dev
```

打开 http://localhost:3100 （默认端口见 `next.config.ts`）。

> 首次登录需要先 seed 一个管理员进 `users` 表（`username` + scrypt 哈希的 `passwordHash`），参考 `docs/progress-log.md` 的 P22。

## 项目结构

完整的分层、命名约定、import 边界见 [`docs/project-structure.md`](docs/project-structure.md)。一句话：`app/` 只放路由，`components/` 放 UI，`lib/` 放业务逻辑（`lib/posts.ts` 是唯一碰数据库的入口）。

## 文档

- [`docs/learning-roadmap.md`](docs/learning-roadmap.md) — 学习路线图与任务节点
- [`docs/progress-log.md`](docs/progress-log.md) — 进度与踩坑记录（P1 → P26）
- [`docs/project-structure.md`](docs/project-structure.md) — 结构约定
