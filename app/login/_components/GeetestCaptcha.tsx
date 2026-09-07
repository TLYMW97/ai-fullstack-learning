"use client";

import { useEffect, useState } from "react";

// 极验滑块：客户端组件。用户滑完验证成功后，把四个参数写成 hidden input，
// 随外层 <form action={login}> 一起提交给后端做二次校验。
//
// 关键：gt4.js 加载 + initGeetest4 放到【模块级单例】只执行一次。
// 之前放在 useEffect 里，React StrictMode 开发模式会让 effect 双执行，
// script 被创建两次、initGeetest4 被调两次、appendTo 两次 → 页面上两个按钮。
// 模块级单例 + effect 里的 cancelled 标志，保证 appendTo 只执行一次。
type ValidateResult = {
  lot_number: string;
  captcha_output: string;
  pass_token: string;
  gen_time: string;
};

let captchaPromise: Promise<CaptchaHandle> | null = null;

function loadCaptcha(captchaId: string): Promise<CaptchaHandle> {
  if (captchaPromise) return captchaPromise;
  captchaPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://static.geetest.com/v4/gt4.js";
    script.async = true;
    script.onload = () => {
      const init = (window as unknown as { initGeetest4?: unknown }).initGeetest4;
      if (typeof init !== "function") return;
      (init as (cfg: object, cb: (c: CaptchaHandle) => void) => void)(
        { captchaId, product: "float" },
        (captcha: CaptchaHandle) => resolve(captcha),
      );
    };
    document.body.appendChild(script);
  });
  return captchaPromise;
}

export function GeetestCaptcha({ captchaId }: { captchaId: string }) {
  const [result, setResult] = useState<ValidateResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadCaptcha(captchaId).then((captcha) => {
      if (cancelled) return; // StrictMode 第一次挂载的 effect 已被取消，跳过
      const box = document.getElementById("geetest-captcha");
      if (box) box.innerHTML = ""; // 清空容器，防重复 appendTo 累积
      captcha.appendTo("#geetest-captcha");
      captcha.onSuccess(() => {
        setResult(captcha.getValidate());
      });
      captcha.onError(() => {
        setError("验证码加载失败，请刷新重试");
      });
    });

    return () => {
      cancelled = true;
    };
  }, [captchaId]);

  return (
    <>
      <div id="geetest-captcha" />
      {error && <p className="text-sm text-red-600">{error}</p>}
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
  onError: (cb: () => void) => void;
  getValidate: () => ValidateResult;
};
