#!/bin/bash
# 构建脚本（在 CI 环境/云效 runner 上执行）：产出 deploy.tar.gz
# 说明：服务器 2GB 内存不够 next build，故构建在 CI 环境做（CI runner 内存足）。
set -euo pipefail

echo "=== 1. 装依赖 ==="
npm install --registry=https://registry.npmmirror.com --no-audit --no-fund

echo "=== 2. 生成 Prisma client ==="
npx prisma generate

echo "=== 3. 构建（output: standalone）==="
npm run build

echo "=== 4. 补 @prisma / pg 到 standalone ==="
# standalone 的依赖追踪收不到 Prisma 7 的动态 require，需手动补（P33 教训）
cp -r node_modules/@prisma .next/standalone/node_modules/
cp -r node_modules/pg .next/standalone/node_modules/

echo "=== 5. 复制 static / public 到 standalone ==="
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public

echo "=== 6. 打包 ==="
tar -czf deploy.tar.gz -C .next/standalone .
echo "构建完成: $(ls -lh deploy.tar.gz | awk '{print $5}')"
