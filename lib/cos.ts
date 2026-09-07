import COS from "cos-nodejs-sdk-v5";

// 腾讯云 COS 上传封装（阶段 3 方案 A：后端中转）。
// 前端把图片传给后端，后端用 SecretId/SecretKey 调 COS SDK 上传，返回可访问 URL。
// 安全模型：SecretId/SecretKey 只留在服务端 .env，前端拿不到，只拿到上传后的 URL。

const cos = new COS({
  SecretId: process.env.COS_SECRET_ID,
  SecretKey: process.env.COS_SECRET_KEY,
});

/** 上传一张图片到 COS，返回可访问的 URL（对象键按日期分目录 + 随机名，避免重名覆盖） */
export async function uploadImage(
  filename: string,
  body: Buffer,
): Promise<string> {
  const bucket = process.env.COS_BUCKET;
  const region = process.env.COS_REGION;
  if (!bucket || !region) {
    throw new Error("COS 配置缺失：请检查 .env 的 COS_BUCKET / COS_REGION");
  }

  const ext = (filename.split(".").pop() || "png").toLowerCase();
  const date = new Date().toISOString().slice(0, 10); // 2026-09-07
  const rand = Math.random().toString(36).slice(2, 8);
  const key = `images/${date}/${Date.now()}-${rand}.${ext}`;

  await new Promise<void>((resolve, reject) => {
    cos.putObject(
      {
        Bucket: bucket,
        Region: region,
        Key: key,
        Body: body,
      },
      (err) => {
        if (err) reject(err);
        else resolve();
      },
    );
  });

  // 虚拟主机风格访问域名（2024 年后新建的桶不支持 path-style）
  return `https://${bucket}.cos.${region}.myqcloud.com/${key}`;
}
