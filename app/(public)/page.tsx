import { Container } from "@/components/Container";
import {
  getPublishedPosts,
  getPublishedPostsCount,
  getAllTags,
  PAGE_SIZE,
} from "@/lib/posts";
import { PostCard } from "@/components/PostCard";
import { Button } from "@/components/ui/Button";
import { site } from "@/lib/site";
import Link from "next/link";

// 动态渲染：CI 构建机没有数据库，构建期预渲染会直接报 DATABASE_URL 未设置。
// 代价是没有静态缓存，但博客流量小、库在本机，实时查库反而总是最新数据。
export const dynamic = "force-dynamic";

// 首页（服务端组件）：Hero + 搜索框 + 主列文章网格 + 侧栏（关于/标签）+ 分页。
// searchParams 驱动筛选：?tag= 按标签筛、?q= 搜标题、?page= 翻页。
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const tag = sp.tag?.trim() || undefined;
  const q = sp.q?.trim() || undefined;
  const page = Math.max(1, Number(sp.page) || 1);

  const posts = await getPublishedPosts({ tag, q, page });
  const total = await getPublishedPostsCount({ tag, q });
  const allTags = await getAllTags();

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const isFiltering = Boolean(tag || q);
  // 精选大卡只在「纯净首页第一页」显示；筛选/翻页时统一网格，避免结果错位
  const showFeatured = !isFiltering && page === 1;
  const featured = showFeatured ? posts[0] : null;
  const list = showFeatured ? posts.slice(1) : posts;

  // 构造带 tag/q 的链接，翻页/清除时保留筛选条件
  const pageHref = (n: number) => {
    const params = new URLSearchParams();
    if (tag) params.set("tag", tag);
    if (q) params.set("q", q);
    if (n > 1) params.set("page", String(n));
    const s = params.toString();
    return s ? `/?${s}` : "/";
  };

  return (
    <>
      <section className="relative overflow-hidden border-b border-card-border">
        <Container size="wide" className="py-16 sm:py-20">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-card-border bg-card px-3 py-1 text-xs font-medium text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              {site.author} 的学习笔记
            </span>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-gradient sm:text-5xl">
              {site.title}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
              {site.description}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {site.techStack.map((t) => (
                <span
                  key={t}
                  className="rounded-lg border border-card-border bg-card/60 px-2.5 py-1 text-xs text-muted"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <Container size="wide" className="py-12">
        {/* 搜索框：GET 提交到当前页，回车或点按钮都能搜 */}
        <form className="flex gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="搜索文章标题…"
            className="w-full max-w-xs rounded-md border border-card-border bg-card px-3 py-2 text-sm text-foreground"
          />
          {tag && <input type="hidden" name="tag" value={tag} />}
          <Button type="submit">搜索</Button>
        </form>

        {isFiltering && (
          <div className="mt-4 flex items-center gap-2 text-sm text-muted">
            <span>
              找到 {total} 篇
              {tag ? `「${tag}」` : ""}
              {q ? `含“${q}”` : ""}
            </span>
            <Link href="/" className="text-accent hover:underline">
              清除筛选
            </Link>
          </div>
        )}

        {posts.length === 0 ? (
          <p className="mt-12 text-muted">没有找到相关文章。</p>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_280px]">
            {/* 主列：首篇精选大卡（仅纯净首页）+ 其余卡片网格 */}
            <main>
              {featured && <PostCard post={featured} featured index={0} />}
              <div
                className={`grid gap-5 sm:grid-cols-2 ${featured ? "mt-6" : ""}`}
              >
                {list.map((post, i) => (
                  <PostCard key={post.id} post={post} index={i + 1} />
                ))}
              </div>
            </main>

            {/* 右侧栏：关于 + 标签（标签取代原「最近文章」，后者与首页列表重复） */}
            <aside className="space-y-6">
              <div className="rounded-xl border border-card-border bg-card p-5">
                <h3 className="text-sm font-semibold text-foreground">关于本站</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  一个边学边写的 AI 原生全栈博客，专注把踩过的坑讲清楚。
                </p>
                <a
                  href={`mailto:${site.socials.email}`}
                  className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
                >
                  邮件联系 →
                </a>
              </div>

              {allTags.length > 0 && (
                <div className="rounded-xl border border-card-border bg-card p-5">
                  <h3 className="text-sm font-semibold text-foreground">标签</h3>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {allTags.map(({ name, count }) => (
                      <Link
                        key={name}
                        href={`/?tag=${encodeURIComponent(name)}`}
                        className={
                          name === tag
                            ? "rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground"
                            : "rounded-full border border-card-border px-2.5 py-0.5 text-xs text-muted transition-colors hover:text-accent"
                        }
                      >
                        {name} {count}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        )}

        {totalPages > 1 && (
          <nav className="mt-10 flex items-center justify-center gap-4 text-sm">
            {page > 1 ? (
              <Link href={pageHref(page - 1)} className="text-accent hover:underline">
                ← 上一页
              </Link>
            ) : (
              <span className="text-muted">← 上一页</span>
            )}
            <span className="text-muted">
              {page} / {totalPages}
            </span>
            {page < totalPages ? (
              <Link href={pageHref(page + 1)} className="text-accent hover:underline">
                下一页 →
              </Link>
            ) : (
              <span className="text-muted">下一页 →</span>
            )}
          </nav>
        )}
      </Container>
    </>
  );
}
