import { Container } from "./Container";
import { site } from "@/lib/site";

// 版本号：由 CI 在构建时注入（NEXT_PUBLIC_* 会被内联进产物，运行时不依赖环境变量）。
// 本地开发没注入 → 显示 dev。见 deploy/build.sh。
const VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "dev";
const BUILD_TIME = process.env.NEXT_PUBLIC_BUILD_TIME;

// 页脚：版权 + 一句定位 + 版本号（用于确认线上是不是刚部署的新版本）。
export function SiteFooter() {
  return (
    <footer className="border-t border-card-border">
      <Container size="wide" className="flex flex-col items-center justify-between gap-2 py-8 text-sm text-muted sm:flex-row">
        <p>
          © {new Date().getFullYear()} {site.author}. 用 Next.js 构建。
        </p>
        <p>记录 AI 原生全栈开发的学习轨迹</p>
        <p className="font-mono text-xs opacity-70" title="构建版本（git 短哈希）">
          {VERSION}
          {BUILD_TIME ? ` · ${BUILD_TIME}` : ""}
        </p>
      </Container>
    </footer>
  );
}
