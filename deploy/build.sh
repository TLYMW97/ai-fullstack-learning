#!/bin/bash
# 构建脚本（在云效构建机 / CI 环境执行）——只负责「构建」，不负责打包
# 打包交给流水线的「构建物上传」步骤（打包路径 .next/standalone），故此处不生成 tar。
set -euo pipefail

# 切到仓库根目录。
# ⚠️ 不能只用 `$(dirname "$0")/..`：脚本被"贴进流水线"时，云效会把它写到
#    /root/workspace/__flow_work/__flow_temp/<id>/ 再执行，$0 指向那个临时文件，
#    dirname 出来的就不是仓库（P41 教训）。优先用云效注入的 PROJECT_DIR。
cd "${PROJECT_DIR:-$(dirname "$0")/..}"

echo "=== 1. 装依赖 ==="
# Node 环境由云效「安装 Node 环境」步骤提供，这里不装 Node
npm install --registry=https://registry.npmmirror.com --no-audit --no-fund

echo "=== 2. 生成 Prisma Client ==="
npx prisma generate

echo "=== 2.5 注入版本号（页脚展示，用来确认线上是不是新版本）==="
# NEXT_PUBLIC_* 会被 Next 在构建时**内联进产物**，运行时不依赖环境变量。
# 云效会注入 CI_COMMIT_ID；本地构建则用 git 短哈希兜底。
BUILD_VER="${CI_COMMIT_ID:-}"
[ -z "$BUILD_VER" ] && BUILD_VER="$(git rev-parse --short HEAD 2>/dev/null || echo unknown)"
export NEXT_PUBLIC_APP_VERSION="$BUILD_VER"
export NEXT_PUBLIC_BUILD_TIME="$(TZ=Asia/Shanghai date '+%m-%d %H:%M' 2>/dev/null || echo '')"
echo "版本号: $NEXT_PUBLIC_APP_VERSION · $NEXT_PUBLIC_BUILD_TIME"

echo "=== 3. 构建（next.config.ts 已配置 output: standalone）==="
npm run build

echo "=== 4. 补 @prisma / pg 到 standalone ==="
# standalone 的依赖追踪收不到 Prisma 7 的动态 require，需手动补（P33 教训）
cp -r node_modules/@prisma .next/standalone/node_modules/
cp -r node_modules/pg .next/standalone/node_modules/

echo "=== 5. 复制 static / public 到 standalone ==="
cp -r .next/static .next/standalone/.next/static
# public 可能不存在（空目录不会被 git 跟踪，克隆下来就没了），存在才复制
[ -d public ] && cp -r public .next/standalone/public || true

echo "构建完成，待归档目录：.next/standalone"
