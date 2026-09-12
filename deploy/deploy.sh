#!/bin/bash
# 部署脚本（云效「主机部署」步骤中执行）
#
# 产物来源：云效「构建物上传」归档的 .next/standalone（打包路径 .next/standalone、不勾「包含打包路径的目录」）
# 下载路径：/root/package.tgz（在「主机部署」步骤里配置）
#
# ⚠️ 顺序上先校验、再切换，绝不能「先清空线上目录、再解压」——
#    制品缺失时会直接把线上站点清空导致宕机（P39 教训）。
set -euo pipefail

APP_DIR=/root/blog
NEW_DIR=/root/blog_new
PKG=/root/package.tgz

echo "=== 0. 检查制品包 ==="
if [ ! -s "$PKG" ]; then
  echo "❌ 制品包不存在或为空：$PKG"
  echo "   → 请检查「主机部署」步骤的「制品」是否已选中构建阶段归档的那个制品"
  exit 1
fi

echo "=== 1. 解压到临时目录并校验（失败不影响线上）==="
rm -rf "$NEW_DIR"
mkdir -p "$NEW_DIR"
tar -xzf "$PKG" -C "$NEW_DIR"
[ -f "$NEW_DIR/server.js" ] || { echo "❌ 制品内容异常：缺少 server.js"; exit 1; }
[ -d "$NEW_DIR/.next" ]     || { echo "❌ 制品内容异常：缺少 .next 目录"; exit 1; }

echo "=== 2. 备份 .env ==="
[ -f "$APP_DIR/.env" ] && cp "$APP_DIR/.env" /root/blog.env.bak

echo "=== 3. 切换到新版本 ==="
rm -rf "$APP_DIR"
mv "$NEW_DIR" "$APP_DIR"

echo "=== 4. 恢复 .env ==="
[ -f /root/blog.env.bak ] && cp /root/blog.env.bak "$APP_DIR/.env"

echo "=== 5. 重启服务 ==="
cd "$APP_DIR"
pm2 restart blog 2>/dev/null || pm2 start server.js --name blog
pm2 save

echo "部署完成 ✅"
