import Link from "next/link";
import { excerpt, formatDate, readingTime } from "@/lib/format";

// 列表卡片用到的 Post 字段（结构类型，避免直接耦合 Prisma 生成客户端）
type PostItem = {
  id: number;
  title: string;
  content: string | null;
  published: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
};

// 文章列表卡片：服务端组件。featured = 首篇精选大卡；index = 入场动画错峰延迟。
export function PostCard({
  post,
  featured = false,
  index = 0,
}: {
  post: PostItem;
  featured?: boolean;
  index?: number;
}) {
  return (
    <article
      style={{ animationDelay: `${index * 70}ms` }}
      className={`group animate-fade-up relative overflow-hidden rounded-xl border border-card-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5 hover:ring-1 hover:ring-accent/30 ${
        featured ? "sm:p-8" : ""
      }`}
    >
      {/* hover 时顶部浮现的渐变线，给卡片一点“发光”的趣味 */}
      <span className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-accent to-fuchsia-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
        <span
          className={
            post.published
              ? "rounded-full bg-accent/10 px-2 py-0.5 font-medium text-accent"
              : "rounded-full bg-muted/10 px-2 py-0.5 font-medium text-muted"
          }
        >
          {post.published ? "已发布" : "草稿"}
        </span>
        <span>{formatDate(post.createdAt)}</span>
        <span>·</span>
        <span>{readingTime(post.content ?? "")} 分钟阅读</span>
      </div>

      <h2
        className={`mt-3 font-semibold text-foreground ${
          featured ? "text-2xl" : "text-lg"
        }`}
      >
        <Link
          href={`/posts/${post.id}`}
          className="transition-colors group-hover:text-accent"
        >
          {post.title}
        </Link>
      </h2>

      {post.content && (
        <p
          className={`mt-2 leading-relaxed text-muted ${
            featured ? "line-clamp-4 text-base" : "line-clamp-3 text-sm"
          }`}
        >
          {excerpt(post.content)}
        </p>
      )}

      {post.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {post.tags.map((t) => (
            <Link
              key={t}
              href={`/?tag=${encodeURIComponent(t)}`}
              className="rounded-full border border-card-border bg-card/60 px-2 py-0.5 text-xs text-muted transition-colors hover:text-accent"
            >
              #{t}
            </Link>
          ))}
        </div>
      )}

      <Link
        href={`/posts/${post.id}`}
        className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent"
      >
        阅读全文 →
      </Link>
    </article>
  );
}
