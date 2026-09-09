#!/bin/bash
# 飞书机器人通知：./notify.sh "消息内容"
# webhook 从环境变量 FEISHU_WEBHOOK 读取（云效流水线里配置）
set -euo pipefail

if [ -z "${FEISHU_WEBHOOK:-}" ]; then
  echo "未配置 FEISHU_WEBHOOK，跳过通知"
  exit 0
fi

msg="${1:-部署通知}"
payload=$(printf '{"msg_type":"text","content":{"text":"%s"}}' "$msg")

curl -s -X POST "$FEISHU_WEBHOOK" \
  -H 'Content-Type: application/json' \
  -d "$payload" > /dev/null

echo "通知已发送: $msg"
