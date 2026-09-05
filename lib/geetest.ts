import { createHmac } from "node:crypto";

// ---------------------------------------------------------------------------
// 极验 GeeTest v4 的服务端二次校验。
//
// 为什么前端验完还要后端再验：滑块在前端通过后产生的参数（lot_number 等）
// 可以被伪造，前端结果不能信。所以后端要拿 captcha_key 重新签名、再调极验的
// validate 接口确认这次验证真的有效。
//
// 零新增依赖：sign_token 用 node:crypto 的 HMAC-SHA256 手写，不引极验 SDK。
// ---------------------------------------------------------------------------

const VALIDATE_URL = "https://gcaptcha4.geetest.com/validate";

export type GeetestParams = {
  lotNumber: string;
  captchaOutput: string;
  passToken: string;
  genTime: string;
};

export async function verifyGeetest(p: GeetestParams): Promise<boolean> {
  const captchaId = process.env.GEETEST_ID;
  const captchaKey = process.env.GEETEST_KEY;
  if (!captchaId || !captchaKey) {
    throw new Error("GEETEST_ID / GEETEST_KEY 未设置：请检查 .env");
  }

  // sign_token = HMAC-SHA256(key = captcha_key, msg = lot_number)，十六进制小写
  const signToken = createHmac("sha256", captchaKey)
    .update(p.lotNumber)
    .digest("hex");

  const body = new URLSearchParams({
    lot_number: p.lotNumber,
    captcha_output: p.captchaOutput,
    pass_token: p.passToken,
    gen_time: p.genTime,
    sign_token: signToken,
  });

  try {
    const res = await fetch(`${VALIDATE_URL}?captcha_id=${captchaId}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { result?: string };
    return data.result === "success";
  } catch {
    // fail-closed：极验接口异常时拒绝登录。官方建议 fail-open（放行）保可用性，
    // 但登录是安全敏感场景，宁可「极验挂了暂时登不进」也不放水。
    return false;
  }
}
