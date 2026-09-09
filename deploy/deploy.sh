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

echo "=== 6. 飞书通知 ==="
# 从 .env 读 FEISHU_WEBHOOK，部署成功后推送到群机器人
set -a; [ -f "$APP_DIR/.env" ] && . "$APP_DIR/.env"; set +a
if [ -n "${FEISHU_WEBHOOK:-}" ]; then
  VER=$(git_hash_placeholder="${PIPELINE_RUN_NUMBER:-手动}"; echo "$git_hash_placeholder")
  curl -s -X POST "$FEISHU_WEBHOOK" \
    -H 'Content-Type: application/json' \
    -d "{\"msg_type\":\"text\",\"content\":{\"text\":\"博客部署完成 ✅\\n来源：${PIPELINE_TITLE:-手动部署}\\n运行：#${VER}\\n主机：$(hostname) $(curl -s --max-time 3 ifconfig.me 2>/dev/null || echo 8.136.107.136)\"}}" \
    > /dev/null
  echo "飞书通知已发送"
else
  echo "未配置 FEISHU_WEBHOOK，跳过通知"
fi

echo "部署完成 ✅"
