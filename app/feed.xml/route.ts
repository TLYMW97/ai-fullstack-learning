import { site } from "@/lib/site";
import { getPublishedPosts } from "@/lib/posts";

// RSS 订阅源：/feed.xml。用 Route Handler（不是 Server Action），直接返回 XML 字符串。
// 为什么手写 XML 而不是引库：RSS 2.0 就这几个字段，一个模板字符串够了，零依赖。
//
// 必须动态渲染：CI 构建机没有数据库，构建期执行本 handler 会报 DATABASE_URL 未设置。
export const dynamic = "force-dynamic";
export async function GET() {
  const posts = await getPublishedPosts();

  const items = posts
    .map((p) => {
      const url = `${site.url}/posts/${p.id}`;
      return `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${url}</link>
      <guid>${url}</guid>
      <pubDate>${p.updatedAt.toUTCString()}</pubDate>
      <description>${escapeXml(p.content?.slice(0, 200) ?? "")}</description>
    </item>`;
    })
    .join("\n");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(site.title)}</title>
    <link>${site.url}</link>
    <description>${escapeXml(site.description)}</description>
    <language>zh-CN</language>
${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}

// 标题/描述里可能含 < > & " ' 等 XML 保留字符，不转义会产出非法 XML
function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
