#!/bin/bash
# 部署脚本（云效流水线「主机部署」步骤中执行）
# 结构说明：云效「构建物上传」会把 deploy.tar.gz 再打一层包，
# 下载到服务器的是外层包（/root/package.tgz），里面才是构建脚本产出的 deploy.tar.gz。
set -euo pipefail

APP_DIR=/root/blog
PKG_DIR=/root/pkg
PKG=/root/package.tgz

echo "=== 1. 备份 .env ==="
[ -f "$APP_DIR/.env" ] && cp "$APP_DIR/.env" /root/blog.env.bak

echo "=== 2. 解开云效制品包（外层） ==="
mkdir -p "$PKG_DIR"
rm -rf "$PKG_DIR"/*
tar -xzf "$PKG" -C "$PKG_DIR"

echo "=== 3. 清空部署目录 ==="
rm -rf "$APP_DIR"/* "$APP_DIR"/.[!.]* 2>/dev/null || true

echo "=== 4. 解压新产物（内层 deploy.tar.gz） ==="
tar -xzf "$PKG_DIR/deploy.tar.gz" -C "$APP_DIR"

echo "=== 5. 恢复 .env ==="
[ -f /root/blog.env.bak ] && cp /root/blog.env.bak "$APP_DIR/.env"

echo "=== 6. 重启服务 ==="
cd "$APP_DIR"
pm2 restart blog 2>/dev/null || pm2 start server.js --name blog
pm2 save

echo "=== 7. 飞书通知 ==="
# 从 .env 读 FEISHU_WEBHOOK，部署成功后推送到群机器人
set -a; [ -f "$APP_DIR/.env" ] && . "$APP_DIR/.env"; set +a
if [ -n "${FEISHU_WEBHOOK:-}" ]; then
  curl -s -X POST "$FEISHU_WEBHOOK" \
    -H 'Content-Type: application/json' \
    -d "{\"msg_type\":\"text\",\"content\":{\"text\":\"博客部署完成 ✅\\n来源：${PIPELINE_TITLE:-云效流水线}\\n运行：#${PIPELINE_BUILD_NUMBER:-手动}\"}}" \
    > /dev/null
  echo "飞书通知已发送"
else
  echo "未配置 FEISHU_WEBHOOK，跳过通知"
fi

echo "部署完成 ✅"
