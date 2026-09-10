# 云效流水线 Flow 配置指南（阶段 6 CI/CD）

> 目标：代码 push 到 GitHub `main` → 云效自动构建 → 制品部署到自有主机（8.136.107.136）→ 飞书群通知。
> 原则：**全部使用云效原生能力**（原生模板 / 原生构建步骤 / 原生制品归档 / 原生主机部署 / 原生通知插件），
> 不自造 tar 打包与解包逻辑——打包由云效「构建物上传」完成，解包只保留一行 `tar -xzf`。

---

## 0. 前置条件

| 项 | 状态 |
|---|---|
| GitHub 仓库 | `https://github.com/TLYMW97/ai-fullstack-learning.git`（分支 `main`） |
| 云效服务连接 | 通用Git 服务连接（已创建，名为「通用Git服务连接」） |
| 主机组 | `blog-server`（已通过手动安装 runner 接入，服务器 8.136.107.136） |
| 飞书群机器人 | webhook 已获取（填入流水线通知插件） |
| 服务器环境 | Node 22 / PM2（进程名 `blog`）/ 部署目录 `/root/blog` / .env 存放于此 |

---

## 1. 新建流水线（用官方模板，别手工搭）

云效控制台 → 流水线 Flow → **新建流水线** → 可视化编排 → 选择语言 **Node.js** →
选择模板 **「Node.js · 测试、构建、部署到阿里云 ECS/自有主机」** → 创建。

模板自带 4 个阶段：`流水线源` → `测试` → `构建` → `部署`。
其中「测试」阶段预置了 *JavaScript 代码扫描* 和 *Node.js 单元测试*——本项目暂无单测，
**删掉 Node.js 单元测试步骤**即可（代码扫描可留可删，留着的代价是每次构建多花 1~2 分钟）。

---

## 2. 流水线源

| 配置项 | 值 |
|---|---|
| 代码源类型 | 通用Git |
| 服务连接 | 通用Git服务连接 |
| 仓库地址 | `https://github.com/TLYMW97/ai-fullstack-learning.git` |
| 默认分支 | `main` |
| 工作目录 | `/`（仓库根目录） |
| 触发方式 | **代码提交自动触发**（push 到 main 即自动部署） |

---

## 3. 构建阶段：Node.js 构建上传

单击构建阶段的任务「Node.js 构建上传」→ 右侧编辑面板：

### 3.1 基本参数

| 配置项 | 值 | 说明 |
|---|---|---|
| 任务名称 | `构建博客`（或保持默认） | 自定义 |
| 构建集群 | 云效默认构建集群 | 免费额度足够；服务器 2G 内存不够跑 next build，**必须用云效构建机** |
| 构建环境 | 指定容器环境（默认） | 云效官方镜像，预装常见 SDK |

### 3.2 任务步骤（依次配置）

**① 安装 Node 环境**

| 配置项 | 值 |
|---|---|
| Node 版本 | **22.x**（从预置版本中选择）|

> Next.js 16 要求 Node ≥ 20.9。**不要**再在脚本里手写下载 Node 的逻辑，这一步由云效负责。

**② 配置 .npmrc 文件**（可选，加速依赖安装）

```
registry=https://registry.npmmirror.com
```

**③ 执行命令**

```bash
bash deploy/build.sh
```

> 构建命令属于用户自定义内容，云效允许自由填写——但**只做「构建」这一件事**：
> 装依赖 → prisma generate → next build → 补全 standalone。
> 产物打包交给下一步的「构建物上传」，脚本里不再 `tar`（旧版 `deploy/build.sh` 里的打包逻辑已删除）。
>
> 📌 **构建期不需要数据库**：查库的路由（首页 / 详情 / sitemap / feed）都已改为 `force-dynamic`
> 请求时渲染，`lib/db.ts` 也是懒加载。所以云效构建机上**不用**配 `DATABASE_URL`（P36）。

**④ 构建物上传**（关键步骤，即你要找的那个）

> 位置：任务步骤区 → **添加步骤** → **上传** 分类 → **构建物上传**
> （不在「构建」分类下，所以之前按「构建物上传」名字找找不到。
> 模板自带的「Node.js 构建上传」任务里其实已经内置了这一步，点开它的面板即可看到。）

| 配置项 | 值 |
|---|---|
| 上传方式 | **归档至云效公共存储空间（供后续任务拉取并部署）** |
| 制品名称 | `blog-standalone` |
| 打包路径 | `.next/standalone` |
| 制品中包含打包路径的目录 | **不勾选**（单路径时不勾选，压缩包内直接是 server.js / node_modules / .next / public，部署端解压即用） |

> ⚠️ 上传方式不要选「组织私有通用制品仓库」——那需要额外开通 Packages 制品仓库授权，本项目不需要。

---

## 4. 部署阶段：主机部署

单击部署阶段的任务「主机部署」→ 右侧编辑面板：

| 配置项 | 值 |
|---|---|
| 制品 | `blog-standalone`（上一步归档的制品） |
| 主机组 | `blog-server` |
| 下载路径 | `/root/package.tgz` |
| 执行用户 | `root` |
| 部署策略 · 暂停方式 | 不暂停（单台主机） |
| 部署策略 · 分批数量 | 1 |

### 部署脚本

```bash
set -e
APP_DIR=/root/blog
PKG=/root/package.tgz

echo "=== 1. 备份 .env ==="
[ -f "$APP_DIR/.env" ] && cp "$APP_DIR/.env" /root/blog.env.bak

echo "=== 2. 清空部署目录 ==="
rm -rf "$APP_DIR"/* "$APP_DIR"/.[!.]* 2>/dev/null || true

echo "=== 3. 解压云效制品 ==="
tar -xzf "$PKG" -C "$APP_DIR"

echo "=== 4. 恢复 .env ==="
[ -f /root/blog.env.bak ] && cp /root/blog.env.bak "$APP_DIR/.env"

echo "=== 5. 重启服务 ==="
cd "$APP_DIR"
pm2 restart blog 2>/dev/null || pm2 start server.js --name blog
pm2 save

echo "部署完成 ✅"
```

> 与仓库 `deploy/deploy.sh` 内容一致。`.env` 不在制品里（已被 gitignore），
> 所以用「备份 → 清空 → 解压 → 恢复」的方式保住线上配置。

---

## 5. 通知：飞书群机器人（云效原生插件）

在**构建**或**部署**任务的编辑面板底部，找到 **任务插件** 区域：

| 配置项 | 值 |
|---|---|
| 插件 | **飞书群通知**（若列表里只有钉钉机器人通知，用第 6 节兜底方案） |
| webhook 地址 | `https://open.feishu.cn/open-apis/bot/v2/hook/75baae85-...`（你的群机器人地址） |
| 运行时机 | **成功** + **失败** 都勾选 |

> 云效官方说明：Flow 提供通知能力，可在流水线生命周期节点（成功/失败）推送到群机器人。
> 官方示例用的是钉钉机器人，飞书同样通过 webhook 方式支持。

---

## 6. 兜底方案：插件不可用时用脚本发通知

如果你们组织里没有「飞书群通知」插件，在**部署脚本末尾**追加：

```bash
set -a; . "$APP_DIR/.env"; set +a
[ -n "${FEISHU_WEBHOOK:-}" ] && curl -s -X POST "$FEISHU_WEBHOOK" \
  -H 'Content-Type: application/json' \
  -d "{\"msg_type\":\"text\",\"content\":{\"text\":\"博客部署完成 ✅\"}}" > /dev/null
```

服务器 `/root/blog/.env` 中已写入 `FEISHU_WEBHOOK`，可直接使用。

---

## 7. 首次运行检查清单

1. 构建阶段日志出现 `构建完成`，且任务卡片出现「产物/制品」下载入口
2. 部署阶段「部署详情」显示 **部署成功**，耗时 30 秒~1 分钟（不是 4 秒——4 秒说明制品为空、脚本没跑）
3. 服务器侧验证：
   - `/root/blog/server.js` 时间戳是刚才
   - `pm2 list` 中 `blog` 的 uptime 归零、状态 online
   - `curl -I http://127.0.0.1:3000/` 返回 200
   - 公网 `http://8.136.107.136/` 返回 200 且文章列表正常
4. 飞书群收到成功通知

---

## 8. 已知风险与预案

| 风险 | 现象 | 预案 |
|---|---|---|
| Turbopack + Prisma 7 跨机器内容哈希（P33 教训） | 部署后线上 500，日志 `Cannot find module @prisma/client-xxxx` | 在部署脚本解压后追加：`npm install --prefix /root/blog @prisma/client@7.10.0 @prisma/adapter-pg@7.10.0 pg --registry=https://registry.npmmirror.com` |
| 制品为空导致部署空跑 | 部署耗时仅几秒，服务器文件未变 | 检查「构建物上传」的打包路径与制品名，确认部署阶段「制品」下拉已选中 |
| 构建机 Node 版本过低 | `next build` 报 Node 版本不满足 | 在「安装 Node 环境」步骤显式选 22.x，不要依赖默认版本 |
| 部署后 `.env` 丢失导致 500 | 应用启动即报数据库连不上 | 部署脚本第 1/4 步的备份恢复逻辑必须保留 |

---

## 9. 与仓库文件的对应关系

| 流水线位置 | 仓库文件 | 作用 |
|---|---|---|
| 构建 · 执行命令 | `deploy/build.sh` | 装依赖、prisma generate、next build、补全 standalone 产物 |
| 部署 · 部署脚本 | `deploy/deploy.sh` | 备份 .env → 解压制品 → 恢复 .env → PM2 重启 |
| 通知 | 云效「飞书群通知」任务插件 | 原生插件，无需仓库文件（旧 `deploy/notify.sh` 已删除） |

---

## 10. 排错：拉取代码超时（`Failed to connect to github.com port 443: Connection timed out`）

### 现象

流水线在**第一个节点（CloneRepoList）**就失败：

```
fatal: unable to access 'https://github.com/TLYMW97/ai-fullstack-learning/':
Failed to connect to github.com port 443: Connection timed out
```

### 定位方法

| 检查 | 命令 / 位置 | 本次结果 |
|---|---|---|
| 构建机在哪台机器上跑 | 看 clone 日志里的工作目录 | `/root/workspace/__flow_work/...` → **云效托管构建集群**，不是自有 runner |
| 自有 runner 是否接到任务 | 服务器 `journalctl -u runner-v0.3.3-...` | 全程 `no new job` → 任务**没有**派给自有 runner |
| 服务器能否连 GitHub | 服务器上 `curl -sS -o /dev/null -w '%{http_code}' https://github.com` | **200（0.79s）**，`git ls-remote` 正常 |

**结论：问题出在云效托管构建机的出网，不在仓库凭证，也不在你的服务器。**

### 解决方案：通用Git 改用 SSH 协议（走 `ssh.github.com`）

社区同类案例的标准解法——HTTPS 的 443 被封，改用 SSH over 443：

1. **生成专用部署密钥**（ed25519，无口令）：
   ```bash
   ssh-keygen -t ed25519 -C "yunxiao-ci-deploy" -f ~/.ssh/yunxiao_ed25519 -N ""
   ```
   本项目的密钥已生成在 `.workbuddy/deploy-key/`（该目录已 gitignore，不会入库）。

2. **GitHub 仓库加只读部署公钥**：
   仓库 → Settings → **Deploy keys** → Add deploy key → 粘贴 `.pub` 内容 →
   **不勾选 Allow write access**（只读拉取足够，泄露风险最小）。

3. **云效新建「通用Git」服务连接（SSH 私钥方式）**：
   全局设置 → 服务连接 → 新建服务连接 → 通用Git → 授权方式选 **SSH 私钥** →
   粘贴私钥全文 → 使用范围「所有人可见」。

4. **流水线源改用 SSH 地址**：

   | 配置项 | 值 |
   |---|---|
   | 服务连接 | 上一步新建的 SSH 服务连接 |
   | 仓库地址 | `git@ssh.github.com:TLYMW97/ai-fullstack-learning.git` ← **注意 `ssh.` 前缀和 22→443 的隐含切换** |
   | 默认分支 | `main` |

   > ⚠️ 必须是 `git@ssh.github.com:...` 这个格式。写成 `git@github.com:...` 会在 22 端口上继续超时。

### 备选方案（方案 A 不通时）

| 方案 | 做法 | 代价 |
|---|---|---|
| B. 自有构建集群 | 构建集群选「私有构建集群」，在你的服务器上构建（服务器**已实测**能直连 GitHub） | 服务器仅 2GB 内存，`next build` 约 10~15 分钟且有 OOM 风险，构建期间可能影响线上服务 |
| C. 迁移代码库 | 把仓库导入云效 Codeup，流水线源改用 Codeup | 最稳定（阿里内网），但源码源不再是 GitHub，需要双推或改工作流 |
