# 本地环境检查报告

> 检查时间：2026-08-31 19:20 · 系统：Windows · 工作区：`E:\AI全栈开发学习\AI原生开发全流程项目`

## 一、检查结论

| 项目 | 检测结果 | 状态 |
| --- | --- | --- |
| Node.js | v22.22.2 | 就绪（Next.js 15 要求 ≥ 18.18） |
| npm | 10.9.7 | 就绪 |
| pnpm | 11.24.0（已安装到托管工作区） | 就绪 |
| Git | 2.55.0 · 万里 `<wanli02@szlanyou.com>` | 就绪 |
| 磁盘 | E 盘可用 621 GB | 就绪 |
| npm 源 | `registry.npmjs.org`，npmmirror 亦可达 | 建议切镜像 |
| 工作区目录 | 空目录 | 就绪 |
| PostgreSQL | 未安装 | 待补 |
| Docker / Compose | 未安装 | 待补 |
| Redis | 未安装 | 待补（可选） |
| SSH 密钥 | `~/.ssh` 下仅有 `known_hosts` | 待补 |
| GitHub | `github.com:443` 直连与代理均超时，`api.github.com` 返回 200 | 受阻 |

## 二、缺口处理命令

### 1. 切 npm 镜像（立即做，加速后续安装）

```bash
npm config set registry https://registry.npmmirror.com
```

### 2. 使用刚装好的 pnpm

pnpm 装在托管工作区，未进 PATH。需要时先执行：

```bash
export PATH="/c/Users/Admin/.workbuddy/binaries/node/workspace/node_modules/.bin:$PATH"
pnpm -v
```

> 注：本机 `corepack` 在 Git Bash 下有路径解析错误（`e:\c\Users\...`），不要用 `corepack enable`，直接用上述 PATH 方式。

### 3. 安装 PostgreSQL

推荐 Docker 方式（需先装 Docker Desktop），或官网安装包：

- Docker Desktop：https://www.docker.com/products/docker-desktop/
- PostgreSQL 安装包：https://www.postgresql.org/download/windows/（建议 16.x）

装完验证：

```bash
psql --version
psql -h localhost -U postgres -c "select version();"
```

### 4. 生成 SSH 密钥（部署到服务器 + 拉代码需要）

```bash
ssh-keygen -t ed25519 -C "wanli02@szlanyou.com"
cat ~/.ssh/id_ed25519.pub
```

把公钥分别加到：GitHub SSH Keys、服务器 `~/.ssh/authorized_keys`。

### 5. GitHub 连通性（2026-08-31 19:45 复测更新）

| 目标 | 结果 |
| --- | --- |
| `github.com:443`（HTTPS） | 超时，直连与代理均不通 |
| `api.github.com:443` | 200，可达 |
| `ssh.github.com:443`（SSH） | **通**，握手成功 |

结论：HTTPS 走不通，但 **SSH over 443 这条路是通的**。

```bash
ssh -T -p 443 git@ssh.github.com
# 返回 Permission denied (publickey) —— 说明连接与握手都已成功，
# 只是本机还没有密钥，所以被拒绝。
```

推荐方案：**SSH 443 + 免登 Web 界面添加公钥**

1. 生成密钥
   ```bash
   ssh-keygen -t ed25519 -C "wanli02@szlanyou.com"
   ```
2. 因为 `github.com` 网页打不开，用可达的 API 添加公钥（需要 GitHub Personal Access Token）
   ```bash
   curl -X POST https://api.github.com/user/keys \
     -H "Authorization: Bearer <你的PAT>" \
     -d '{"title":"win-pc","key":"<id_ed25519.pub 的内容>"}'
   ```
3. 配置 SSH 走 443
   ```bash
   # ~/.ssh/config
   Host github.com
     HostName ssh.github.com
     Port 443
     User git
   ```
4. 验证
   ```bash
   ssh -T git@github.com   # 期望输出 Hi <你的用户名>! You've successfully authenticated...
   ```

备选：改用 Gitee / 腾讯云 Coding 作主仓库（国内直连），后续云效可直接监听。

## 三、建议的执行顺序

1. 切 npm 镜像 → 生成本地 SSH key
2. 装 Docker Desktop + PostgreSQL（本地开发用 Docker 起 PG 最省事）
3. 初始化 Next.js 15 项目（App Router + TypeScript + Tailwind + Prisma）
4. 打通本地：Prisma 建模 + 迁移 + 前后台骨架页面
5. 接外部服务：COS 上传 → 极验 → 邮件验证码 → 百度统计
6. 接 CI/CD：云效流水线 + 服务器部署 + 飞书机器人
7. 域名 / CDN / HTTPS 收尾

## 四、开工前需要你确认的外部资源

| 资源 | 用途 | 是否已有 |
| --- | --- | --- |
| 域名 | 前台 + 后台访问入口 | 待确认 |
| 云服务器 | 部署 Next.js（建议 2C4G 起） | 待确认 |
| 腾讯云 COS 桶 | 图片 / 附件存储 | 待确认 |
| 极验账号（captcha_id / key） | 登录行为验证 | 待确认 |
| 邮箱 SMTP 授权码 | 验证码发送 | 待确认 |
| 百度统计 site id | PV / UV 埋点 | 待确认 |
| 飞书自定义机器人 Webhook | 部署结果通知 | 待确认 |
| 阿里云效账号 | 流水线 | 待确认 |
