# AI 全栈博客 · 学习路线图与任务节点

> 目标：以「可上线的博客系统」为样本，完整走通 **前端 + 后台管理系统 + 后端 + 部署运维**
> 的全流程，最终可独立交付一个带域名、CDN、对象存储、登录、CI/CD、数据埋点的真实项目。
> 技术栈：Next.js 16（App Router）+ React 19 + Tailwind 4 + Prisma 7 + PostgreSQL 17（Docker）。
>
> 用法：每个节点含【掌握内容 / 关键任务 / 参考资料 / 状态】。状态标记：
> ⬜ 未开始 · 🟡 进行中 · ✅ 已完成。达成状态与问题记录在 `progress-log.md`。

---

## 阶段 0 · 环境与工程地基 ✅（已基本完成）

**掌握内容**：本地开发环境的全貌；为什么用 Docker 装数据库；Prisma「schema 即真相」的心智模型；包管理与 Node 版本管理。

**关键任务**
- [x] nvm 切换 Node 22（≥ 20.9）、pnpm 安装
- [x] `create-next-app` 脚手架（App Router）
- [x] Docker Desktop + `docker-compose.yml` 起 PostgreSQL 17 容器
- [x] Prisma 接入：schema → `migrate dev` → `generate`
- [x] 读链路打通：服务端组件 `await prisma.post.findMany()` 渲染首页
- [x] TypeScript 类型检查 / `next build` 通过

**参考资料**
- Next.js 安装：https://nextjs.org/docs/app/getting-started/installation
- Prisma 快速开始：https://www.prisma.io/docs/getting-started
- Prisma 7 升级注意（配置改名、driver adapter）：https://pris.ly/d/major-version-upgrade

---

## 阶段 1 · 博客基础功能（CRUD 闭环） ✅

**掌握内容**：App Router 的服务端组件 vs 客户端组件边界；**Server Action**（不写 API 也能改数据）；动态路由 `[id]`；Markdown 渲染；列表/详情/分页。

**关键任务**
- [x] 用 Server Action 实现「写文章」（补全 CRUD 的 C）— 写库路径已验证（curl 直打会 500，需用浏览器表单或 Route Handler 旁路验证，见 P11）
- [x] 文章列表页（服务端组件 `findMany` 渲染，带草稿/已发布区分与 `/posts/<id>` 链接）
- [x] 文章详情页 `app/posts/[id]/page.tsx`（动态路由 `params` 是 Promise + `generateMetadata` 做 SEO）
- [x] Markdown 正文渲染（`react-markdown` + `@tailwindcss/typography`，已验证 h1/h2/加粗/斜体/列表/代码块/引用）
- [x] 后端接口层（验证用 Route Handler `app/api/smoke` 跑通「增查改删」闭环，验证后删除）

> 阶段 1 的 `node_modules` 曾因沙箱把 pnpm 软链弄成空壳而大面积损坏，修复过程（junction 全树修复、错名/错版本链、Turbopack 对 `debug` 的 `browser` 字段解析）记录在 `progress-log.md` 的 P12–P14。

**参考资料**
- Server Actions：https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions
- 动态路由：https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes
- Metadata / SEO：https://nextjs.org/docs/app/building-your-application/optimizing/metadata

---

## 阶段 2 · 后台管理系统与登录 🔐 🟡（方案 A：密码已迁库 users 表；邮箱/极验待扩展）

**掌握内容**：会话与鉴权模型（Cookie/Session/JWT）；第三方验证（极验 GeeTest 人机校验）；邮箱验证码登录；受保护路由；管理后台 UI。

**关键任务**
- [x] 鉴权方案：自建 Session（密码 + Cookie 会话，纯 `node:crypto`，零外部依赖，见 P19）；密码哈希已迁库到 `User` 表（`username`/`email` 唯一，预留多用户，见 P22）。Auth.js（NextAuth）作为后续备选，本阶段不引入以保持最小依赖
- [x] 接入**极验 GeeTest v4**：前端滑块（`app/login/_components/GeetestCaptcha.tsx` 加载 gt4.js）+ 后端二次校验（`lib/geetest.ts` 用 `node:crypto` HMAC-SHA256 手写 sign_token 调 validate，零新增依赖，见 P26）
- [ ] **邮箱验证码登录**：发码（SMTP / 邮件服务）→ 校验 → 签发会话 —— 待你提供 SMTP 授权码或 Resend Key
- [x] 受保护的管理后台：`/admin` 下文章管理表格（增删改查、**删除二次确认弹窗**、**公开列表隐藏草稿**；方案 A 已加 `proxy.ts` 路由保护 + 写操作 `requireAuth()` 硬闸门，见 P19/P20）
- [ ] 后台富文本编辑器（Markdown 编辑增强 / 所见即所得）—— 待定
- [x] 登录态中间件（Next 16 由 `middleware.ts` 改名为 `proxy.ts`）：未登录访问 `/admin/*` 一律 307 跳 `/login`（见 P19）

**参考资料**
- Auth.js（NextAuth）：https://authjs.dev/getting-started
- 极验 GeeTest 文档：https://docs.geetest.com/
- Node 发邮件（nodemailer）：https://nodemailer.com/about/

---

## 阶段 3 · 文件上传与海量存储（腾讯云 COS） 📦

**掌握内容**：对象存储 vs 服务器本地磁盘；**前端直传 COS**（后端只发临时密钥/签名）的安全模型；CDN 加速静态资源；大文件/海量文件策略。

**关键任务**
- [ ] 腾讯云 COS 开通、Bucket 与权限配置
- [ ] 后端签发临时密钥（STS）或上传签名
- [ ] 前端直传 COS + 上传进度/失败重试
- [ ] 富文本里的图片走 COS + CDN 域名
- [ ] 缩略图 / 图片处理（COS 数据万象 或 CDN 图像处理）

**参考资料**
- 腾讯云 COS 文档：https://cloud.tencent.com/document/product/436
- COS 临时密钥（STS）：https://cloud.tencent.com/document/product/436/14048
- COS 前端直传：https://cloud.tencent.com/document/product/436/64960

---

## 阶段 4 · 前端体验与工程化 🎨 🟡（期1+期2 已落地，SSG/ISR 已落地，视觉升级已落地，代码体检修复已落地；组件库补全/标签分类/SEO 收尾待做）

**掌握内容**：Tailwind 工程化与组件抽象；列表分页/搜索/标签；静态生成（SSG）/增量再生（ISR）取舍；响应式与主题。

**关键任务**
- [x] 设计系统地基：Tailwind v4 `@theme inline` 设计令牌（中性色 ramp + violet 强调色 + 容器宽度）、`.dark` class 暗色（非系统媒体查询）、Geist + 中文回退字体、无闪烁主题切换（内联脚本 + 客户端按钮，**零新增依赖**）（见 P15）
- [x] 公共组件抽象：`Container` / `SiteHeader`（sticky+毛玻璃）/ `SiteFooter` / `ThemeToggle` / `PostCard`；`lib/site.ts` 站点配置、`lib/format.ts` 摘要/阅读时长/日期
- [x] 首页 Hero + 文章卡片列表（摘要 + 阅读时长 + 已发布/草稿徽标 + hover 抬升）
- [x] 详情页体验：阅读时长、上一篇/下一篇导航、编辑入口、`prose` 排版 + 统一深色代码块
- [x] 统一 UI 组件库：抽 `components/ui/Button`（primary/outline）与 `components/ui/Field`（label+Input/Textarea），重构登录/写文章/编辑/后台退出按钮复用；Table 无表格需求不抽（YAGNI，见 P25）
- [x] 标签分类：`Post` 加 `tags String[]` + 迁移；首页支持 `?tag=` 筛选、`?q=` 标题搜索、`?page=` 分页；侧栏标签区块（按计数倒序）；写/编辑表单加标签输入（逗号分隔）（见 P25）
- [x] 静态化与 ISR：`app/page.tsx` + `app/posts/[id]/page.tsx` 加 `export const revalidate = 60`，详情页 `generateStaticParams` 预渲染已有文章（`dynamicParams` 默认 true，新文章按需渲染）；dev 下不生效，生产 `next build` 才真正静态化（见 P16）
- [x] 代码体检与加固：Server Action 变更后 `revalidatePath` 一致性（首页 / 后台 / 详情都要刷）、`Number(formData.get("id"))` 的 NaN 守卫失效（`Number(null)===0`）、动态路由 `Number(id)` 非数字要 `notFound()` 而非 500；后台加 `force-dynamic`、后台页面统一设计令牌（见 P18）
- [x] 项目结构规范化：路由分组 `(public)`、动态段 `[postId]` 语义化、私有文件夹 `_components/`、分层 import 边界，并对照 Next.js 官网 project-structure 成文（`docs/project-structure.md`，见 P21/P23）
- [x] SEO 收尾：`sitemap.xml`（`app/sitemap.ts`）、`robots.txt`（`app/robots.ts`）、RSS（`app/feed.xml/route.ts`）、自定义 404（`app/not-found.tsx`）；Open Graph / metadata 基础已在 P15 做（见 P24）

**参考资料**
- Tailwind CSS：https://tailwindcss.com/docs
- Next.js 渲染策略：https://nextjs.org/docs/app/building-your-application/rendering

---

## 阶段 5 · 部署与服务器运维 🚀

**掌握内容**：一台真实服务器上的完整部署；域名解析；HTTPS；反向代理；环境变量与密钥管理；数据库备份。

**关键任务**
- [ ] 云服务器（阿里云 ECS / 轻量应用服务器）+ 域名解析（A/AAAA/CNAME）
- [ ] 反向代理（Nginx 或 Caddy）+ HTTPS（Let's Encrypt 免费证书）
- [ ] 生产环境变量（`.env` 不入库，服务器注入）
- [ ] 数据库迁移与备份策略（`pg_dump` / 定时备份）
- [ ] 进程守护（systemd / pm2）

**参考资料**
- Next.js 部署：https://nextjs.org/docs/app/building-your-application/deploying
- Caddy 自动 HTTPS：https://caddyserver.com/docs/
- 阿里云 ECS：https://help.aliyun.com/product/25365.html

---

## 阶段 6 · CI/CD 自动化（阿里云效 + GitHub + 飞书） ⚙️

**掌握内容**：流水线概念；GitHub webhook / 推送触发；构建→部署自动化；部署结果通知（飞书机器人）。

**关键任务**
- [ ] 阿里云效「流水线」新建，源码连接 GitHub 仓库
- [ ] `push` 到 `main` / `develop` 触发：安装依赖 → 类型检查 → 构建 → 部署
- [ ] 飞书自定义机器人：部署开始/成功/失败 Webhook 通知
- [ ] 环境分离：预览环境（develop）与生产环境（main）

**参考资料**
- 阿里云效流水线：https://help.aliyun.com/product/150040.html
- 飞书自定义机器人（Webhook）：https://open.feishu.cn/document/ukTMukTMukTM/ucTM5YjL4EjNz4

---

## 阶段 7 · 数据埋点与增长（百度统计） 📊

**掌握内容**：PV/UV 等指标含义；前端埋点接入；自定义事件；看板解读。

**关键任务**
- [ ] 接入百度统计：在 `layout.tsx` 注入统计脚本
- [ ] 关键事件埋点（文章阅读、按钮点击）
- [ ] 区分开发/生产环境，避免污染数据
- [ ] 看板：PV/UV、来源、停留时长

**参考资料**
- 百度统计：https://tongji.baidu.com/
- 在 Next.js 注入第三方脚本：`next/script`：https://nextjs.org/docs/app/api-reference/components/script

---

## 阶段 8 · 收尾与复盘 🧾

**掌握内容**：全链路联调；性能与安全自查清单；把零散经验沉淀为文档。

**关键任务**
- [ ] 全链路跑通（前端→后台→登录→上传→部署→埋点）
- [ ] 安全自查（密钥、XSS、SQL 注入已由 Prisma 防住、速率限制）
- [ ] 写 README / 复盘文档

---

## 执行纪律（本项目约定）
1. 每个节点开始前先对齐范围，再动手（你确认后再写代码）。
2. 学过的都要讲透原理，并说明「非 AI 开发者平时在哪打开/维护这个项目」。
3. 每完成一个节点，更新 `progress-log.md` 的达成状态与问题记录。
4. 数据库永远在 Docker 里；改表结构先改 `schema.prisma` 再 `migrate dev`。
5. 每次开机先确认 Docker Desktop 在运行、Node 用 22（`nvm use 22.20.0`）。
