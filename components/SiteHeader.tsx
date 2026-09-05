import Link from "next/link";
import { Container } from "./Container";
import { ThemeToggle } from "./ThemeToggle";
import { site } from "@/lib/site";

// 顶部导航：站点名 + 导航 + 主题切换。sticky + 毛玻璃，滚动时常驻。
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-card-border bg-background/80 backdrop-blur">
      <Container size="wide" className="flex h-16 items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-base font-semibold tracking-tight"
        >
          <span className="h-2 w-2 rounded-full bg-accent shadow-[0_0_10px_var(--accent)]" />
          <span className="text-gradient">{site.name}</span>
        </Link>
        <nav className="flex items-center gap-1">
          {site.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm text-muted transition-colors hover:bg-card hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
          <ThemeToggle />
        </nav>
      </Container>
    </header>
  );
}
