import Link from "next/link";
import { Container } from "@/components/Container";
import { login } from "./actions";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { GeetestCaptcha } from "./_components/GeetestCaptcha";
import { EmailCodeForm } from "./_components/EmailCodeForm";

// 登录页：/login。两种方式：账号密码（默认）+ 邮箱验证码（?mode=code）。
// 服务端组件 + Server Action，密码/验证码只发到服务端。
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; mode?: string }>;
}) {
  const { error, mode } = await searchParams;
  const isCode = mode === "code";
  // captcha_id 是公开值，服务端从 .env 读出后传给客户端滑块组件
  const captchaId = process.env.GEETEST_ID ?? "";

  const tabClass = (active: boolean) =>
    `pb-2 text-sm font-medium ${
      active
        ? "border-b-2 border-accent text-foreground"
        : "text-muted transition-colors hover:text-foreground"
    }`;

  return (
    <Container className="py-20">
      <div className="mx-auto max-w-sm">
        <h1 className="text-2xl font-semibold text-foreground">登录后台</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          登录后才能进入 /admin 写文章、改文章。
        </p>

        {/* 两种登录方式切换 */}
        <div className="mt-6 flex gap-4 border-b border-card-border">
          <Link href="/login" className={tabClass(!isCode)}>
            账号登录
          </Link>
          <Link href="/login?mode=code" className={tabClass(isCode)}>
            验证码登录
          </Link>
        </div>

        {isCode ? (
          <>
            {error === "1" && (
              <p className="mt-4 text-sm text-red-600">验证码不对或已过期。</p>
            )}
            <EmailCodeForm />
          </>
        ) : (
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

            {/* key={error}：登录失败回来（error 变化）时强制重挂载滑块，让它回到初始状态可重新验证 */}
            <GeetestCaptcha key={error ?? "none"} captchaId={captchaId} />

            {error === "captcha" && (
              <p className="text-sm text-red-600">请先完成滑块验证。</p>
            )}
            {error === "1" && (
              <p className="text-sm text-red-600">
                用户名或密码不对，再试一次。
              </p>
            )}

            <Button type="submit">登录</Button>
          </form>
        )}
      </div>
    </Container>
  );
}
