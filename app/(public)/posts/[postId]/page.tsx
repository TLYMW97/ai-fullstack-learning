import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Container } from "@/components/Container";
import { ReadingProgress } from "@/components/ReadingProgress";
import { formatDate, readingTime } from "@/lib/format";
import { getPostById, getPostsOrdered } from "@/lib/posts";

// 动态渲染：CI 构建机没有数据库，构建期预渲染会直接报 DATABASE_URL 未设置。
// 因此不再用 ISR + generateStaticParams，改由服务端在请求时实时渲染（库在本机，开销可忽略）。
export const dynamic = "force-dynamic";

// 文章详情页：路由 /posts/[postId]
//
// 重点 1：Next.js 16 动态路由 params 是 Promise，组件里必须 await 才能拿到 postId。
// 重点 2：generateMetadata 生成 <title>/<meta description>，对 SEO 与分享卡片很重要。
// 重点 3：正文是 Markdown，用 react-markdown 渲染，外面包 .prose（来自
//         @tailwindcss/typography）自动获得排版；代码块样式在 globals.css 里统一。

type PageProps = { params: Promise<{ postId: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { postId: rawId } = await params;
  // ponytail: 非数字 id 时 Number() 得到 NaN，Prisma 会抛错而不是返回 null，先拦掉
  const postId = Number(rawId);
  if (!Number.isInteger(postId) || postId <= 0) return { title: "文章不存在" };
  const post = await getPostById(postId);
  if (!post) return { title: "文章不存在" };
  return {
    title: post.title,
    description: post.content?.slice(0, 120) ?? "",
  };
}

export default async function PostDetail({ params }: PageProps) {
  const { postId: rawId } = await params;
  // ponytail: 同上，/posts/abc 这类非数字 id 要 404 而不是 500
  const postId = Number(rawId);
  if (!Number.isInteger(postId) || postId <= 0) notFound();
  const post = await getPostById(postId);

  // 查不到就返回 404（Next 会用默认的 not-found 页面）。
  if (!post) notFound();

  // 用 createdAt 倒序列表计算上一篇 / 下一篇（学习博客体量小，直接内存计算即可）。
  const all = await getPostsOrdered();
  const idx = all.findIndex((p) => p.id === post.id);
  const prev = idx > 0 ? all[idx - 1] : null;
  const next = idx >= 0 && idx < all.length - 1 ? all[idx + 1] : null;

  return (
    <Container className="animate-fade-up py-16">
      <ReadingProgress />
      <Link
        href="/"
        className="text-sm text-muted transition-colors hover:text-foreground"
      >
        ← 返回首页
      </Link>

      <h1 className="mt-6 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        {post.title}
      </h1>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted">
        <span
          className={
            post.published
              ? "text-accent"
              : "rounded-full bg-muted/10 px-2 py-0.5 font-medium text-muted"
          }
        >
          {post.published ? "已发布" : "草稿"}
        </span>
        <span>·</span>
        <span>{formatDate(post.createdAt)}</span>
        <span>·</span>
        <span>{readingTime(post.content ?? "")} 分钟阅读</span>
        <span>·</span>
        <Link
          href={`/admin/${post.id}/edit`}
          className="text-accent transition-colors hover:underline"
        >
          编辑
        </Link>
      </div>

      {/* prose / prose-invert：亮暗主题下都有的正文排版样式；代码块走 globals.css 定制 */}
      <article className="prose prose-zinc mt-10 max-w-none dark:prose-invert">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {post.content ?? ""}
        </ReactMarkdown>
      </article>

      {(prev || next) && (
        <nav className="mt-16 grid gap-4 border-t border-card-border pt-8 sm:grid-cols-2">
          {prev ? (
            <Link
              href={`/posts/${prev.id}`}
              className="group rounded-xl border border-card-border bg-card p-4 transition-all hover:-translate-y-0.5"
            >
              <span className="text-xs text-muted">← 上一篇</span>
              <p className="mt-1 font-medium text-foreground transition-colors group-hover:text-accent">
                {prev.title}
              </p>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href={`/posts/${next.id}`}
              className="group rounded-xl border border-card-border bg-card p-4 text-right transition-all hover:-translate-y-0.5 sm:text-right"
            >
              <span className="text-xs text-muted">下一篇 →</span>
              <p className="mt-1 font-medium text-foreground transition-colors group-hover:text-accent">
                {next.title}
              </p>
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </Container>
  );
}
