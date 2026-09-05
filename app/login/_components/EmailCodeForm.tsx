"use client";

import { useEffect, useState } from "react";
import { sendCode, verifyCodeLogin } from "../actions";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";

// 邮箱验证码登录表单：客户端组件。
// 「发送验证码」按钮点击调 sendCode（Server Action，直接传 email），成功后 60s 倒计时防连点；
// 表单整体 action 指向 verifyCodeLogin（Server Action）提交登录。
export function EmailCodeForm() {
  const [email, setEmail] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  // 倒计时：每 1s 减 1，到 0 停
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  async function handleSend() {
    if (!email || countdown > 0) return;
    setMessage(null);
    const res = await sendCode(email);
    if (res.ok) {
      setMessage("验证码已发送，请查收邮件");
      setCountdown(60);
    } else {
      setMessage(res.error ?? "发送失败，请重试");
    }
  }

  return (
    <form action={verifyCodeLogin} className="mt-8 flex flex-col gap-4">
      <Field label="邮箱" htmlFor="email">
        <Input
          id="email"
          name="email"
          type="email"
          required
          placeholder="登录邮箱"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>

      <Field label="验证码" htmlFor="code">
        <div className="flex gap-2">
          <Input
            id="code"
            name="code"
            required
            placeholder="6 位验证码"
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleSend}
            disabled={countdown > 0}
            className="whitespace-nowrap"
          >
            {countdown > 0 ? `${countdown}s 后重发` : "发送验证码"}
          </Button>
        </div>
      </Field>

      {message && <p className="text-sm text-muted">{message}</p>}

      <Button type="submit">登录</Button>
    </form>
  );
}
