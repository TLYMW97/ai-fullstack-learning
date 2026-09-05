import nodemailer from "nodemailer";

// 发信：QQ 邮箱 SMTP（阶段 2 方案 B 邮箱验证码登录）。
// 主机/端口按 QQ 邮箱写死（smtp.qq.com:465 SSL），账号/授权码从 .env 读。
// 为什么引 nodemailer：Node 标准库没有 SMTP 客户端，手写协议复杂易错，
// nodemailer 是发邮件的标准库，这里的功能性必需依赖（项目唯一的外部运行依赖）。
const transporter = nodemailer.createTransport({
  host: "smtp.qq.com",
  port: 465,
  secure: true, // 465 走 SSL
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/** 给指定邮箱发登录验证码邮件 */
export async function sendVerificationCode(to: string, code: string) {
  await transporter.sendMail({
    from: process.env.SMTP_USER, // 发件人 = 自己
    to,
    subject: "【AI 全栈学习博客】登录验证码",
    text: `你的登录验证码是：${code}，5 分钟内有效。`,
    html: `<p>你的登录验证码是：<strong>${code}</strong>，5 分钟内有效。</p>`,
  });
}
