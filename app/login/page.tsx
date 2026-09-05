import { Container } from "@/components/Container";
import { login } from "./actions";

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
          <div className="flex flex-col gap-2">
            <label htmlFor="username" className="text-sm font-medium text-muted">
              用户名
            </label>
            <input
              id="username"
              name="username"
              required
              autoFocus
              autoComplete="username"
              placeholder="管理员用户名"
              className="rounded-md border border-card-border bg-card px-3 py-2 text-foreground"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-sm font-medium text-muted">
              密码
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="输入密码"
              className="rounded-md border border-card-border bg-card px-3 py-2 text-foreground"
            />
          </div>

          {error && <p className="text-sm text-red-600">用户名或密码不对，再试一次。</p>}

          <button
            type="submit"
            className="rounded-full bg-accent px-6 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
          >
            登录
          </button>
        </form>
      </div>
    </Container>
  );
}
