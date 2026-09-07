import { notFound } from "next/navigation";
import { updatePost } from "../../actions";
import { getPostById } from "@/lib/posts";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { ImageUploader } from "../../_components/ImageUploader";

// 后台必须每次请求都查最新数据：生产构建若被静态化，会看到过期的文章内容。
export const dynamic = "force-dynamic";

// 编辑文章页：/admin/[postId]/edit
// 服务端组件先按 postId 查出文章，把现有值填进表单；
// 提交时表单 action 指向 updatePost（同一个文件里的 Server Action）。
export default async function EditPostPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId: rawId } = await params;
  // ponytail: 非数字 id 时 Number() 得到 NaN，Prisma 会抛错而不是返回 null，先 404
  const postId = Number(rawId);
  if (!Number.isInteger(postId) || postId <= 0) notFound();
  const post = await getPostById(postId);
  if (!post) notFound();

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-semibold text-foreground">编辑文章</h1>

      <form action={updatePost} className="mt-8 flex flex-col gap-5">
        {/* 把 id 藏进表单，updatePost 才能知道改的是哪篇 */}
        <input type="hidden" name="id" value={post.id} />

        <Field label="标题" htmlFor="title">
          <Input id="title" name="title" required defaultValue={post.title} />
        </Field>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label htmlFor="content" className="text-sm font-medium text-muted">
              正文（支持 Markdown）
            </label>
            <ImageUploader />
          </div>
          <Textarea
            id="content"
            name="content"
            rows={8}
            defaultValue={post.content ?? ""}
          />
        </div>

        <Field label="标签（逗号分隔）" htmlFor="tags">
          <Input id="tags" name="tags" defaultValue={post.tags.join(", ")} />
        </Field>

        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            name="published"
            defaultChecked={post.published}
          />
          直接发布（不勾就是草稿）
        </label>

        <Button type="submit" className="self-start">
          更新
        </Button>
      </form>
    </main>
  );
}
