"use server";

import { redirect } from "next/navigation";
import { startSession, verifyPassword } from "@/lib/auth";
import { verifyGeetest } from "@/lib/geetest";

// 登录：先过极验人机验证（防暴力破解），再过用户名密码，都对才发会话 Cookie。
//
// ponytail: 仍没有「失败次数限制」。极验已经挡掉机器批量尝试，真人暴力破解
// 属于低风险，等真需要再加失败计数。
export async function login(formData: FormData) {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  // 1. 极验二次校验：滑块参数缺失或校验失败，一律回「验证码未通过」
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

  // 2. 用户名密码校验：失败只回一个笼统错误，不透露「用户不存在」
  if (!username || !password || !(await verifyPassword(username, password))) {
    redirect("/login?error=1");
  }

  await startSession();
  redirect("/admin");
}
