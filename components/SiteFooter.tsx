import { Container } from "./Container";
import { site } from "@/lib/site";

// 页脚：版权 + 一句定位。
export function SiteFooter() {
  return (
    <footer className="border-t border-card-border">
      <Container size="wide" className="flex flex-col items-center justify-between gap-2 py-8 text-sm text-muted sm:flex-row">
        <p>
          © {new Date().getFullYear()} {site.author}. 用 Next.js 构建。
        </p>
        <p>记录 AI 原生全栈开发的学习轨迹</p>
      </Container>
    </footer>
  );
}
