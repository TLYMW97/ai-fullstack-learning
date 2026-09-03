import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// 文章详情页：路由 /posts/[id]
//
// 重点 1：Next.js 16 的动态路由 params 是 Promise，组件里必须 await 才能拿到 id。
// 重点 2：generateMetadata 用来给这张页面生成 <title>/<meta description>，
//         对搜索引擎（SEO）和分享卡片很重要——这是"详情页"和普通接口最大的不同之一。
// 重点 3：正文是 Markdown，用 react-markdown 渲染；外面套 .prose（来自
//         @tailwindcss/typography 插件）自动获得好看的排版样式。

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const post = await prisma.post.findUnique({ where: { id: Number(id) } });
  if (!post) return { title: "文章不存在" };
  return {
    title: post.title,
    description: post.content?.slice(0, 100) ?? "",
  };
}

export default async function PostDetail({ params }: PageProps) {
  const { id } = await params;
  const post = await prisma.post.findUnique({ where: { id: Number(id) } });

  // 查不到就返回 404（Next 会用默认的 not-found 页面）。
  if (!post) notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <a
        href="/"
        className="text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        ← 返回首页
      </a>

      <h1 className="mt-6 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
        {post.title}
      </h1>

      <div className="mt-3 flex gap-4 text-xs text-zinc-400">
        <span className={post.published ? "text-red-600" : "text-zinc-400"}>
          {post.published ? "已发布" : "草稿"}
        </span>
        <span>
          {post.createdAt.toLocaleDateString("zh-CN", { timeZone: "Asia/Shanghai" })}
        </span>
        <a
          href={`/admin/${post.id}/edit`}
          className="text-blue-600 transition-colors hover:underline"
        >
          编辑
        </a>
      </div>

      {/* prose / prose-invert：亮暗主题下都有的正文排版样式 */}
      <article className="prose prose-zinc mt-8 max-w-none dark:prose-invert">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content ?? ""}</ReactMarkdown>
      </article>
    </main>
  );
}
