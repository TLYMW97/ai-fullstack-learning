#!/bin/bash
# 部署脚本（在服务器上执行）：解压产物 + 恢复 .env + 重启 PM2
# 产物 deploy.tar.gz 由 CI 上传到服务器 /root/deploy.tar.gz
set -euo pipefail

APP_DIR=/root/blog

echo "=== 1. 备份 .env ==="
[ -f "$APP_DIR/.env" ] && cp "$APP_DIR/.env" /root/blog.env.bak

echo "=== 2. 清空部署目录 ==="
rm -rf "$APP_DIR"/* "$APP_DIR"/.[!.]* 2>/dev/null || true

echo "=== 3. 解压新产物 ==="
tar -xzf /root/deploy.tar.gz -C "$APP_DIR"

echo "=== 4. 恢复 .env ==="
[ -f /root/blog.env.bak ] && cp /root/blog.env.bak "$APP_DIR/.env"

echo "=== 5. 重启服务 ==="
cd "$APP_DIR"
pm2 restart blog 2>/dev/null || pm2 start server.js --name blog
pm2 save

echo "部署完成 ✅"
