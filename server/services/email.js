import nodemailer from "nodemailer";

let transporter = null;

async function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.log("📧 Using SMTP:", process.env.SMTP_HOST);
    return transporter;
  }

  // Development: use Ethereal test account
  const account = await nodemailer.createTestAccount();
  transporter = nodemailer.createTransport({
    host: account.smtp.host,
    port: account.smtp.port,
    secure: account.smtp.secure,
    auth: { user: account.user, pass: account.pass },
  });
  console.log("📧 Using Ethereal test account:", account.user);
  console.log("📧 View sent emails at: https://ethereal.email");
  return transporter;
}

const FROM = () => `"CodeLensAI" <${process.env.SMTP_FROM || "noreply@codelensai.dev"}>`;
const CLIENT = () => process.env.CLIENT_URL || "http://localhost:5173";

export async function sendVerificationEmail(email, name, token) {
  const t = await getTransporter();
  const verifyUrl = `${CLIENT()}/verify-email?token=${token}`;

  const info = await t.sendMail({
    from: FROM(),
    to: email,
    subject: "Verify your CodeLensAI email",
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;padding:40px 0;">
        <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
          <div style="background:#000;padding:24px 32px;">
            <span style="color:#fff;font-size:18px;font-weight:700;">🔍 CodeLensAI</span>
          </div>
          <div style="padding:32px;">
            <h2 style="margin:0 0 8px;font-size:20px;color:#111;">Hi ${name || "there"}! 👋</h2>
            <p style="color:#6b7280;margin:0 0 24px;">Please verify your email address to activate your account.</p>
            <a href="${verifyUrl}" style="display:inline-block;background:#000;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Verify Email Address</a>
            <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;">This link expires in 24 hours.</p>
          </div>
        </div>
      </div>`,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) console.log("📧 Preview URL:", previewUrl);
  return info;
}

export async function sendPasswordResetEmail(email, name, token) {
  const t = await getTransporter();
  const resetUrl = `${CLIENT()}/reset-password?token=${token}`;

  const info = await t.sendMail({
    from: FROM(),
    to: email,
    subject: "Reset your CodeLensAI password",
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;padding:40px 0;">
        <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
          <div style="background:#000;padding:24px 32px;">
            <span style="color:#fff;font-size:18px;font-weight:700;">🔍 CodeLensAI</span>
          </div>
          <div style="padding:32px;">
            <h2 style="margin:0 0 8px;font-size:20px;color:#111;">Password Reset</h2>
            <p style="color:#6b7280;margin:0 0 24px;">Click below to reset your password. Expires in 1 hour.</p>
            <a href="${resetUrl}" style="display:inline-block;background:#000;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Reset Password</a>
          </div>
        </div>
      </div>`,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) console.log("📧 Reset email preview:", previewUrl);
}
