#!/bin/bash
# 构建脚本（在云效构建机 / CI 环境执行）——只负责「构建」，不负责打包
# 打包交给流水线的「构建物上传」步骤（打包路径 .next/standalone），故此处不生成 tar。
set -euo pipefail

# 固定以仓库根目录为工作目录（云效「执行命令」的工作目录可能不同）
cd "$(dirname "$0")/.."

echo "=== 1. 装依赖 ==="
# Node 环境由云效「安装 Node 环境」步骤提供，这里不装 Node
npm install --registry=https://registry.npmmirror.com --no-audit --no-fund

echo "=== 2. 生成 Prisma Client ==="
npx prisma generate

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
