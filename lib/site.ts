// 站点级配置：名字、描述、作者、导航、社交。改这里即可全局生效。
export const site = {
  name: "AI 全栈学习博客",
  title: "AI 全栈学习博客",
  description:
    "记录从 0 到 1 的 AI 原生全栈开发学习过程：Next.js、PostgreSQL、Prisma、Tailwind……一边踩坑一边沉淀。",
  author: "万里",
  // 首页 hero / 侧栏展示用的技术栈标签
  techStack: [
    "Next.js 16",
    "React 19",
    "TypeScript",
    "PostgreSQL",
    "Prisma 7",
    "Tailwind v4",
    "Turbopack",
  ],
  // 用于 OG / 分享卡片的绝对地址；本地开发用 localhost:3100
  url: "http://localhost:3100",
  nav: [
    { href: "/", label: "首页" },
    { href: "/admin/new", label: "写文章" },
    { href: "/admin", label: "后台" },
  ],
  socials: {
    email: "751112877@qq.com",
  },
} as const;
