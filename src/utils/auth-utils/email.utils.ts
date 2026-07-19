import nodemailer from "nodemailer";
import env from "../../config/env.js";
import logger from "../../observability/pino-logging/index.pino.js";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: Number(env.SMTP_PORT),
  secure: env.SMTP_SECURE === "true",
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

function verifyEmailTemplate(url: string) {
  return {
    subject: "Verify your email",
    html: `
      <h2>Verify your Email</h2>

      <p>Click the button below to verify your account.</p>

      <a
        href="${url}"
        style="
          display:inline-block;
          padding:12px 24px;
          background:#2563eb;
          color:white;
          text-decoration:none;
          border-radius:6px;
        "
      >
        Verify Email
      </a>

      <p>This link expires in 24 hours.</p>
    `,
  };
}

function resetPasswordTemplate(url: string) {
  return {
    subject: "Reset your password",
    html: `
      <h2>Password Reset</h2>

      <p>Click below to reset your password.</p>

      <a
        href="${url}"
        style="
          display:inline-block;
          padding:12px 24px;
          background:#dc2626;
          color:white;
          text-decoration:none;
          border-radius:6px;
        "
      >
        Reset Password
      </a>

      <p>This link expires in 15 minutes.</p>
    `,
  };
}

export async function sendVerificationEmail(email: string, token: string) {
  const url = `${env.APP_URL}/verify-email?token=${token}`;

  const template = verifyEmailTemplate(url);

  try {
    await transporter.sendMail({
      from: env.MAIL_FROM,
      to: email,
      subject: template.subject,
      html: template.html,
    });
  } catch (error: any) {
    logger.error("failed to send verification email", error);
    throw error;
  }
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const url = `${env.APP_URL}/reset-password?token=${token}`;

  const template = resetPasswordTemplate(url);

  try {
    await transporter.sendMail({
      from: env.MAIL_FROM,
      to: email,
      subject: template.subject,
      html: template.html,
    });
  } catch (error: any) {
    logger.error("failed to send password reset email", error);
    throw error;
  }
}
