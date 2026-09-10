#!/bin/bash
# 部署脚本（云效「主机部署」步骤中执行）
# 云效会把构建阶段「构建物上传」归档的制品包下载到「下载路径」（本流水线约定 /root/package.tgz），
# 包内是 .next/standalone 的内容（server.js / node_modules / .next / public / package.json）。
# 说明：打包与下发由云效原生完成，这里只做「解压 + 恢复配置 + 重启」，不自造双层包逻辑。
set -euo pipefail

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
