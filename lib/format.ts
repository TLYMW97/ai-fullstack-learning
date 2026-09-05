// 正文相关的纯函数工具：摘要、阅读时长、日期格式化。
// 不依赖数据库，可在服务端组件 / 卡片里直接调用。

/** 去掉 Markdown 语法噪音，取纯文本前 len 字作为摘要 */
export function excerpt(content: string, len = 120): string {
  const text = content
    .replace(/```[\s\S]*?```/g, " ") // 代码块
    .replace(/`[^`]*`/g, " ") // 行内代码
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // 图片
    .replace(/\[[^\]]*\]\([^)]*\)/g, " ") // 链接
    .replace(/[#>*_~`>-]+/g, " ") // 标题/引用/强调等符号
    .replace(/\s+/g, " ")
    .trim();
  return text.length > len ? text.slice(0, len) + "…" : text;
}

/** 中文按字数、英文按词数估算阅读分钟数（中文 ~350 字/分，英文 ~200 词/分） */
export function readingTime(content: string): number {
  const cn = (content.match(/[一-龥]/g) || []).length;
  const en = (
    content.replace(/[一-龥]/g, " ").match(/[a-zA-Z0-9]+/g) || []
  ).length;
  const minutes = Math.ceil(cn / 350 + en / 200);
  return Math.max(1, minutes);
}

// 格式化器创建有成本，提到模块顶层复用，别每篇文章/每张卡片都 new 一个。
const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "Asia/Shanghai",
});

/** 中文长格式日期：2026年8月31日 */
export function formatDate(date: Date): string {
  return dateFormatter.format(date);
}
