"use client";

import { useState, type ChangeEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { uploadImage } from "../actions";

// 正文编辑器：受控 textarea + 编辑/预览切换 + 内嵌图片上传。
// 复用 react-markdown 做实时预览（零新依赖），上传走 uploadImage（Server Action）。
//
// 为什么不用所见即所得富文本（TipTap 等）：个人博客、站长自己写 Markdown，
// 纯 Markdown + 实时预览已经够用，引富文本编辑器是大依赖 + 复杂（YAGNI）。
export function MarkdownEditor({
  name = "content",
  defaultValue = "",
}: {
  name?: string;
  defaultValue?: string;
}) {
  const [content, setContent] = useState(defaultValue);
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage(null);
    const fd = new FormData();
    fd.append("file", file);
    const res = await uploadImage(fd);
    setUploading(false);

    if (res.ok) {
      // 用回调更新 state（而非直接操作 DOM），保证受控组件状态同步
      setContent((c) => c + `\n![${file.name}](${res.url})\n`);
      setTab("edit");
      setMessage("已插入正文");
    } else {
      setMessage(res.error ?? "上传失败");
    }
    e.target.value = "";
  }

  const tabClass = (active: boolean) =>
    `rounded-md px-3 py-1 text-sm font-medium transition-colors ${
      active
        ? "bg-card text-foreground"
        : "text-muted hover:text-foreground"
    }`;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex gap-1">
          <button type="button" className={tabClass(tab === "edit")} onClick={() => setTab("edit")}>
            编辑
          </button>
          <button
            type="button"
            className={tabClass(tab === "preview")}
            onClick={() => setTab("preview")}
          >
            预览
          </button>
        </div>
        <label className="cursor-pointer rounded-full border border-card-border px-4 py-1 text-sm font-medium text-foreground transition-colors hover:bg-card">
          {uploading ? "上传中…" : "上传图片"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={handleUpload}
          />
        </label>
      </div>

      {message && <p className="mb-2 text-sm text-muted">{message}</p>}

      {tab === "edit" ? (
        <textarea
          name={name}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={12}
          placeholder="用 Markdown 写正文"
          className="w-full rounded-md border border-card-border bg-card px-3 py-2 text-foreground"
        />
      ) : (
        <>
          {/* 预览态下 textarea 不在 DOM 里，用 hidden input 兜住 name，保证表单能提交 content */}
          <input type="hidden" name={name} value={content} />
          <div className="prose prose-zinc min-h-48 w-full rounded-md border border-card-border bg-card px-4 py-3 dark:prose-invert">
            {content.trim() ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            ) : (
              <p className="text-muted">（还没有内容，切回「编辑」开始写吧）</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
