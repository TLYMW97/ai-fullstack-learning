"use client";

import { useEffect, useState } from "react";

// 极验滑块：客户端组件。用户滑完验证成功后，把四个参数写成 hidden input，
// 随外层表单一起提交给后端做二次校验。
//
// 关键设计：
// 1. gt4.js 用模块级单例只加载一次（避免 StrictMode 双执行 / 重挂载时 script 重复加载）。
// 2. 每次挂载都【新建 captcha 实例】（不复用），配合外层 key 变化，登录失败回来时
//    强制重挂载 → 全新实例 → 验证回到初始状态（等价于极验的 reset()）。
// 3. cleanup 里 destroy 本次创建的实例，避免残留。
type ValidateResult = {
  lot_number: string;
  captcha_output: string;
  pass_token: string;
  gen_time: string;
};

type InitFn = (cfg: object, cb: (c: CaptchaHandle) => void) => void;

let initPromise: Promise<InitFn> | null = null;

function loadInit(): Promise<InitFn> {
  if (initPromise) return initPromise;
  initPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://static.geetest.com/v4/gt4.js";
    script.async = true;
    script.onload = () => {
      const init = (window as unknown as { initGeetest4?: unknown }).initGeetest4;
      resolve(typeof init === "function" ? (init as InitFn) : (() => {}));
    };
    script.onerror = () => resolve(() => {});
    document.body.appendChild(script);
  });
  return initPromise;
}

export function GeetestCaptcha({ captchaId }: { captchaId: string }) {
  const [result, setResult] = useState<ValidateResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let localCaptcha: CaptchaHandle | null = null;

    loadInit().then((init) => {
      if (cancelled) return;
      init({ captchaId, product: "float" }, (captcha: CaptchaHandle) => {
        if (cancelled) return;
        localCaptcha = captcha;
        const box = document.getElementById("geetest-captcha");
        if (box) box.innerHTML = ""; // 清空，防累积
        captcha.appendTo("#geetest-captcha");
        captcha.onSuccess(() => {
          setResult(captcha.getValidate());
        });
        captcha.onError(() => {
          setError("验证码加载失败，请刷新重试");
        });
      });
    });

    return () => {
      cancelled = true;
      // 销毁本实例，避免重挂载（StrictMode / key 变化）后残留旧按钮
      localCaptcha?.destroy?.();
      const box = document.getElementById("geetest-captcha");
      if (box) box.innerHTML = "";
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
  destroy: () => void;
};
