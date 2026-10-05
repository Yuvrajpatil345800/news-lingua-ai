import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config({ path: [".env", ".env.local", "../.env.local"] });

const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";

export const isEmailConfigured = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);
const transporter = isEmailConfigured
  ? nodemailer.createTransport({ host: SMTP_HOST, port: SMTP_PORT, secure: SMTP_PORT === 465, auth: { user: SMTP_USER, pass: SMTP_PASS } })
  : null;
const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);

export const sendAuthEmail = async ({ toEmail, displayName, actionUrl, actionLabel, purpose }) => {
  if (transporter) {
    await transporter.sendMail({
      from: `"AI News Summarizer" <${SMTP_USER}>`,
      to: toEmail,
      subject: `${actionLabel} | AI News Summarizer`,
      text: `Hello ${displayName}, use this link to ${purpose}: ${actionUrl}. This link expires in one hour.`,
      html: `<p>Hello ${escapeHtml(displayName)},</p><p>Use the link below to ${escapeHtml(purpose)}. It expires in one hour and can only be used once.</p><p><a href="${actionUrl}">${escapeHtml(actionLabel)}</a></p>`,
    });
  } else {
    console.log(`\n=================================================`);
    console.log(`📧 [DEV EMAIL LOG] Sent to: ${toEmail}`);
    console.log(`🔗 ${actionLabel} Link: ${actionUrl}`);
    console.log(`=================================================\n`);
  }
};
