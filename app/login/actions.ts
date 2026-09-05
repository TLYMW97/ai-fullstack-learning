"use server";

import { redirect } from "next/navigation";
import { startSession, verifyPassword, findUserByEmail } from "@/lib/auth";
import { verifyGeetest } from "@/lib/geetest";
import { generateCode, saveCode, verifyCode } from "@/lib/verification";
import { sendVerificationCode } from "@/lib/mailer";

// 登录（密码方式）：先过极验人机验证，再过用户名密码，都对才发会话 Cookie。
export async function login(formData: FormData) {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  // 1. 极验二次校验
  const lotNumber = String(formData.get("lot_number") ?? "");
  const captchaOutput = String(formData.get("captcha_output") ?? "");
  const passToken = String(formData.get("pass_token") ?? "");
  const genTime = String(formData.get("gen_time") ?? "");

  if (
    !lotNumber ||
    !(await verifyGeetest({ lotNumber, captchaOutput, passToken, genTime }))
  ) {
    redirect("/login?error=captcha");
  }

  // 2. 用户名密码校验
  if (!username || !password || !(await verifyPassword(username, password))) {
    redirect("/login?error=1");
  }

  await startSession();
  redirect("/admin");
}

// 发送验证码（客户端按钮直接调用，返回结果对象而非 redirect）
export async function sendCode(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return { ok: false, error: "邮箱不能为空" };

  // 只给已注册邮箱发码，防止被用来给任意邮箱发骚扰邮件。
  // 这里会透露「邮箱是否注册」——个人博客仅站长一个邮箱，枚举风险可忽略，直接提示更友好。
  const user = await findUserByEmail(normalized);
  if (!user) return { ok: false, error: "该邮箱未注册" };

  const code = generateCode();
  saveCode(normalized, code);
  await sendVerificationCode(normalized, code);
  return { ok: true };
}

// 邮箱验证码登录：验证码对（且未过期）→ 邮箱对应一个用户 → 签发会话
export async function verifyCodeLogin(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const code = String(formData.get("code") ?? "").trim();

  if (!email || !code || !verifyCode(email, code)) {
    redirect("/login?mode=code&error=1");
  }

  const user = await findUserByEmail(email);
  if (!user) redirect("/login?mode=code&error=1");

  await startSession();
  redirect("/admin");
}
