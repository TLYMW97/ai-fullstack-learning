# 项目结构与代码约定（Project Structure & Conventions）

> 目的：把「目录怎么分、文件怎么命名、前后端边界在哪、数据库怎么设计」的规则写下来，
> 让项目可维护、可交接、可扩展——新文件照这套规则放，旧代码有据可查。
> 配套：`docs/learning-roadmap.md`（要学什么）、`docs/progress-log.md`（踩过什么坑）。

> 状态：截至本轮（P21）页面组件已统一走 `lib/posts.ts` 数据层、`[postId]` 语义化、公开前台收进 `app/(public)/` 路由分组。尚未 git commit，见 progress-log「待你确认」。

---

## 一、目录总览

```
ai-blog/
├─ app/                     # 【路由层】App Router —— 只放「页面 / 布局 / 该路由专属的 Server Action」
│  ├─ (public)/             #   公开前台（括号 = 路由分组，不产生 URL 段）
│  │  ├─ page.tsx           #   → /                首页
│  │  └─ posts/
│  │     └─ [postId]/       #   → /posts/:postId   文章详情（动态路由段，见下「命名」）
│  │        └─ page.tsx
│  ├─ login/                #   登录鉴权
│  │  ├─ page.tsx           #   → /login
│  │  └─ actions.ts         #   login Server Action（跟随路由就近放）
│  ├─ admin/                #   后台管理（被 proxy.ts 保护，未登录跳 /login）
│  │  ├─ page.tsx           #   → /admin            文章管理列表
│  │  ├─ actions.ts         #   create/update/delete/logout Server Action
│  │  ├─ DeleteButton.tsx   #   客户端删除按钮（含二次确认）
│  │  ├─ new/page.tsx       #   → /admin/new        写文章
│  │  └─ [postId]/edit/     #   → /admin/:postId/edit  编辑文章
│  │     └─ page.tsx
│  ├─ layout.tsx            # 根布局（全站 Header/Footer/主题）
│  ├─ globals.css           # 全局样式 + 设计令牌（Tailwind v4）
│  └─ favicon.ico
├─ components/              # 【UI 组件层】被多页复用的纯展示组件（服务端优先，客户端才标 "use client"）
├─ lib/                     # 【业务逻辑层】不含 JSX 的服务端逻辑，按领域分文件
│  ├─ posts.ts              #   文章数据访问层（DAL）：所有 prisma.post.* 收口于此
│  ├─ auth.ts               #   登录态判断 / 密码校验 / 会话启动结束
│  ├─ session.ts            #   会话令牌签发校验（纯 crypto，proxy 与 auth 共用）
│  ├─ db.ts                 #   Prisma 单例（全项目唯一 DB 入口）
│  ├─ format.ts             #   摘要 / 阅读时长 / 日期
│  ├─ site.ts               #   站点配置常量
│  └─ generated/prisma/     #   ⚙️ Prisma 自动生成，勿手改（已 gitignore）
├─ prisma/                  # 【数据层】schema 即真相
│  ├─ schema.prisma         #   唯一的表结构定义
│  └─ migrations/           #   迁移历史（一次 schema 变更一次，勿手删）
├─ proxy.ts                 # Next 16 的路由保护（middleware 改名），拦 /admin
├─ public/                  # 静态资源
└─ docs/                    # 学习文档
```

### 分层边界（谁不能 import 谁）
- **app/** → 可以 import `components/` 和 `lib/`；页面负责「取数据 + 渲染」。
- **components/** → 可以 import `lib/`；**不应** import `app/` 里的东西（不依赖具体路由）。
- **lib/** → 纯逻辑，不 import 任何 `app/` / `components/`；`lib/posts.ts` 是唯一允许碰 Prisma 模型读写的地方。
- **规则一句话**：UI 想读数据，调 `lib/posts.ts` 的语义化函数（`getPublishedPosts`…），**别在页面里直接写 `prisma.post.*`**。这样换数据库 / 加缓存 / 加权限都只改一个文件。

---

## 二、命名约定

### 1. 为什么路由目录里有 `[postId]`？
这是 **Next.js App Router 的动态路由段语法**，不是命名错误，也不能改成普通名字：
- `app/posts/[postId]/page.tsx` → 匹配 `/posts/1`、`/posts/abc`，方括号里的 `postId` 会被 Next 解析进 `params`。
- 若去掉方括号写成 `app/posts/postId/`，那就只会匹配字面 URL `/posts/postId`，别的 id 全部 404。
- **改法不是去方括号，而是把方括号里的词起得语义化**：用 `[postId]` 而非 `[id]`，让人一眼知道这是「文章 id」而非随便一个 id。

> 想读一个「普通参数化」URL（如 `/blog/my-post-slug`）时，同样用 `[slug]` 段——方括号语法躲不开，能优化的是命名。

### 2. 数据库模型为什么叫 `Post`（大写单数）？
这是 **Prisma / PostgreSQL 的默认约定**，不是没规范：
- Prisma 模型名用**单数 PascalCase**（`Post`），默认映射的**数据库表名是复数 snake_case**（`posts`）——Prisma 会自动转换，你不用手写表名。
- 所以「表名是否复数」这件事 Prisma 已替你管好，模型写 `Post` 是标准写法。
- 要改的是**字段语义**而非大小写。当前字段（`title/content/published/createdAt/updatedAt`）已语义化；公开列表已加 `@@index([published, createdAt])` 走索引。

### 3. 文件 / 函数 / 变量命名
- 页面组件：`page.tsx`（Next 约定），按路由语义起父目录名（`new`/`edit`）。
- 服务端逻辑：动词开头、表意 —— `getPublishedPosts`、`createPost`、`requireAuth`、`startSession`。
- Server Action：与 DAL 同名但作用不同（`createPost` 收表单+鉴权+失效缓存 vs `repoCreatePost` 只写库），靠前缀/注释区分，避免手滑跨层。
- 常量全大写：`SESSION_COOKIE`、`SESSION_MAX_AGE`。

---

## 三、数据库设计纪律（延续 roadmap）
1. 改表先改 `prisma/schema.prisma`，再 `prisma migrate dev`（自动生成 SQL 迁移并应用）。
2. 迁移历史文件（`prisma/migrations/`）**永不手改/手删**——它是可回滚的真相，删了等于丢掉回滚能力。
3. 单用户博客用 `Post` 一张表 + `.env` 里的哈希/密钥即可；要支持多用户 / 评论 / 标签时，再按同一步骤加 `User`/`Comment`/`Tag` 表（迁移记录会继续追加）。

---

## 四、改代码时照着做的清单
- [ ] 想读数据？去 `lib/posts.ts` 看有没有现成函数，没有再往上加一个，别在页面里裸写 `prisma`。
- [ ] 想加 UI？能复用 `components/` 就用；能写成服务端组件就别加 `"use client"`。
- [ ] 改了数据？记得在 Server Action 里 `revalidatePath` 所有展示它的路由。
- [ ] 新鉴权路由？把路径加进 `proxy.ts` 的 matcher。
- [ ] 跑一遍 `tsc --noEmit` 确认 0 错再交付。
