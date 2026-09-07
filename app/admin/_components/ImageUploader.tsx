"use client";

import { useState, type ChangeEvent } from "react";
import { uploadImage } from "../actions";

// 图片上传按钮：选文件 → 调 uploadImage（Server Action，后端中转存 COS）→
// 拿到 URL 后把 Markdown 图片语法 `![名字](url)` 追加进正文 textarea（id="content"）。
export function ImageUploader() {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage(null);
    const fd = new FormData();
    fd.append("file", file);
    const res = await uploadImage(fd);
    setUploading(false);

    if (res.ok) {
      const ta = document.getElementById("content") as HTMLTextAreaElement | null;
      if (ta) {
        ta.value += `\n![${file.name}](${res.url})\n`;
      }
      setMessage("已上传并插入正文");
    } else {
      setMessage(res.error ?? "上传失败");
    }
    e.target.value = ""; // 清空，允许连续选同一文件
  }

  return (
    <div className="flex items-center gap-2">
      <label className="cursor-pointer rounded-full border border-card-border px-5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-card">
        {uploading ? "上传中…" : "上传图片"}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          disabled={uploading}
          onChange={handleFile}
        />
      </label>
      {message && <span className="text-sm text-muted">{message}</span>}
    </div>
  );
}
