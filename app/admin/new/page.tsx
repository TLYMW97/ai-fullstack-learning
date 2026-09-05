import { createPost } from "../actions";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";

// 写文章页面（后台）。
// 服务端组件，直接把 Server Action 作为 <form> 的 action 属性传入，
// 浏览器原生表单提交就会调用它——无需写任何 fetch / API。
//
// 访问受 proxy.ts 保护：未登录会被重定向到 /login（见阶段 2，P19）。
export default function NewPostPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-semibold text-foreground">写文章</h1>

      <form action={createPost} className="mt-8 flex flex-col gap-5">
        <Field label="标题" htmlFor="title">
          <Input id="title" name="title" required placeholder="给文章起个标题" />
        </Field>

        <Field label="正文（支持 Markdown）" htmlFor="content">
          <Textarea id="content" name="content" rows={8} placeholder="用 Markdown 写正文" />
        </Field>

        <Field label="标签（逗号分隔）" htmlFor="tags">
          <Input id="tags" name="tags" placeholder="例如：Next.js, Prisma, 部署" />
        </Field>

        <label className="flex items-center gap-2 text-sm text-muted">
          <input type="checkbox" name="published" />
          直接发布（不勾就是草稿）
        </label>

        <Button type="submit" className="self-start">
          发布
        </Button>
      </form>
    </main>
  );
}
