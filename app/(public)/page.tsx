import { Container } from "@/components/Container";
import { getPublishedPosts } from "@/lib/posts";
import { PostCard } from "@/components/PostCard";
import { formatDate } from "@/lib/format";
import { site } from "@/lib/site";
import Link from "next/link";

// ISR：列表页静态化，每 60s 再生一次（生产构建时预渲染；dev 下仍每次实时查询）。
export const revalidate = 60;

// 首页（服务端组件）：Hero 区 + 主列文章网格 + 右侧栏（关于/最近文章）。
export default async function Home() {
  const posts = await getPublishedPosts();
  const [featured, ...rest] = posts;

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
        {posts.length === 0 ? (
          <p className="text-muted">还没有文章，去后台写一篇吧。</p>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
            {/* 主列：首篇精选大卡 + 其余卡片网格，横向铺满，解决“两边空白太多” */}
            <main>
              {featured && <PostCard post={featured} featured index={0} />}
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                {rest.map((post, i) => (
                  <PostCard key={post.id} post={post} index={i + 1} />
                ))}
              </div>
            </main>

            {/* 右侧栏：让留白变成有用信息，而非死板空白 */}
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

              {rest.length > 0 && (
                <div className="rounded-xl border border-card-border bg-card p-5">
                  <h3 className="text-sm font-semibold text-foreground">最近文章</h3>
                  <ul className="mt-3 space-y-3">
                    {rest.slice(0, 5).map((p) => (
                      <li key={p.id}>
                        <Link href={`/posts/${p.id}`} className="group block">
                          <span className="line-clamp-1 text-sm text-foreground transition-colors group-hover:text-accent">
                            {p.title}
                          </span>
                          <span className="text-xs text-muted">
                            {formatDate(p.createdAt)}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </aside>
          </div>
        )}
      </Container>
    </>
  );
}
