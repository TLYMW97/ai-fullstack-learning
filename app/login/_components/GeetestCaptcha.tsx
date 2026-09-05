"use client";

import { useEffect, useState } from "react";

// 极验滑块：客户端组件。动态加载极验 gt4.js + 初始化滑块，用户滑完验证成功后，
// 把四个参数（lot_number / captcha_output / pass_token / gen_time）写成 hidden input，
// 随外层 <form action={login}> 一起提交给后端做二次校验。
//
// captcha_id 是公开值（前端要用），由服务端组件从 .env 读出后作为 prop 传入，
// 不在这里硬编码，保证单一来源。
type ValidateResult = {
  lot_number: string;
  captcha_output: string;
  pass_token: string;
  gen_time: string;
};

export function GeetestCaptcha({ captchaId }: { captchaId: string }) {
  const [result, setResult] = useState<ValidateResult | null>(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://static.geetest.com/v4/gt4.js";
    script.async = true;
    script.onload = () => {
      const init = (window as unknown as { initGeetest4?: unknown }).initGeetest4;
      if (typeof init !== "function") return;
      (init as (cfg: object, cb: (c: CaptchaHandle) => void) => void)(
        { captchaId, product: "bind" },
        (captcha: CaptchaHandle) => {
          captcha.appendTo("#geetest-captcha");
          captcha.onSuccess(() => {
            setResult(captcha.getValidate());
          });
        },
      );
    };
    document.body.appendChild(script);
    return () => {
      script.remove();
    };
  }, [captchaId]);

  return (
    <>
      <div id="geetest-captcha" />
      {result && (
        <>
          <input type="hidden" name="lot_number" value={result.lot_number} />
          <input type="hidden" name="captcha_output" value={result.captcha_output} />
          <input type="hidden" name="pass_token" value={result.pass_token} />
          <input type="hidden" name="gen_time" value={result.gen_time} />
        </>
      )}
    </>
  );
}

// 极验全局回调对象的最小结构（不引 SDK 类型，够用即可）
type CaptchaHandle = {
  appendTo: (selector: string) => void;
  onSuccess: (cb: () => void) => void;
  getValidate: () => ValidateResult;
};
