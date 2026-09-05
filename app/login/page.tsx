import { Container } from "@/components/Container";
import { login } from "./actions";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";

// 登录页：/login
// 服务端组件 + Server Action，密码只发到服务端，不经过任何前端状态。
// searchParams 在 Next 15/16 也是 Promise，要 await。
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <Container className="py-20">
      <div className="mx-auto max-w-sm">
        <h1 className="text-2xl font-semibold text-foreground">登录后台</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          登录后才能进入 /admin 写文章、改文章。
        </p>

        <form action={login} className="mt-8 flex flex-col gap-4">
          <Field label="用户名" htmlFor="username">
            <Input
              id="username"
              name="username"
              required
              autoFocus
              autoComplete="username"
              placeholder="管理员用户名"
            />
          </Field>

          <Field label="密码" htmlFor="password">
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="输入密码"
            />
          </Field>

          {error && <p className="text-sm text-red-600">用户名或密码不对，再试一次。</p>}

          <Button type="submit">登录</Button>
        </form>
      </div>
    </Container>
  );
}
