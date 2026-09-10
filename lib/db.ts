import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

// ---------------------------------------------------------------------------
// 这个文件是「整个项目唯一的数据库入口」。
// 任何地方要查数据，都 `import { prisma } from "@/lib/db"`，不要自己 new。
// ---------------------------------------------------------------------------

// 为什么要挂到 globalThis 上？
// Next.js 开发模式每次改代码都会热更新（重新执行模块代码）。
// 如果每次热更新都新建客户端，就会开一堆连接池，很快把 PostgreSQL 的连接数
// 撑爆，报 "too many clients already"。
// 挂到 globalThis 之后，热更新只是复用同一个实例。生产环境不会热更新，所以不需要。
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient(): PrismaClient {
  // 缺环境变量时给一句人能看懂的报错，而不是让 adapter 拿着 undefined 去连库。
  // ⚠️ 这个校验必须放在「第一次真正要用数据库」时，不能放在模块顶层：
  // CI 构建机没有 .env（也不该连生产库），构建期只是 import 这个模块而已，
  // 顶层 throw 会让整个构建失败（P36 教训）。
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL 未设置：请检查项目根目录的 .env");
  }

  // Prisma 7 的变化：客户端不再自带数据库驱动，必须显式传一个 adapter。
  // 好处是"用什么驱动连数据库"变成可插拔的——换 Neon / PlanetScale / SQLite
  // 只要换 adapter，业务代码一行不用改。代价是初始化多了一步。
  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({ adapter });
}

// 懒加载：import 本模块什么都不做，第一次访问 prisma.xxx 时才创建客户端。
// 这样构建期（没有数据库）不会被 import 拖死，而调用方的写法保持不变。
// ponytail: 代理只做一层转发；若哪天嫌它绕，换成导出的 getPrisma() 函数即可。
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = (globalForPrisma.prisma ??= createPrismaClient());
    return Reflect.get(client, prop);
  },
});
