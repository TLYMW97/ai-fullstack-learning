import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

// ---------------------------------------------------------------------------
// 这个文件是「整个项目唯一的数据库入口」。
// 任何地方要查数据，都 `import { prisma } from "@/lib/db"`，不要自己 new。
// ---------------------------------------------------------------------------

// 缺环境变量时给一句人能看懂的报错，而不是让 adapter 拿着 undefined 去连库。
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL 未设置：请检查项目根目录的 .env");
}

function createPrismaClient() {
  // Prisma 7 的变化：客户端不再自带数据库驱动，必须显式传一个 adapter。
  // 好处是"用什么驱动连数据库"变成可插拔的——换 Neon / PlanetScale / SQLite
  // 只要换 adapter，业务代码一行不用改。代价是初始化多了一步。
  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({ adapter });
}

// 为什么要挂到 globalThis 上？
// Next.js 开发模式每次改代码都会热更新（重新执行模块代码）。
// 如果直接 `export const prisma = new PrismaClient()`，每次热更新都会新建一个
// 连接池，改十次代码就开十个池，很快把 PostgreSQL 的连接数撑爆，
// 报 "too many clients already"。
// 挂到 globalThis 之后，热更新只是复用同一个实例。生产环境不会热更新，所以不需要。
const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createPrismaClient>;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
