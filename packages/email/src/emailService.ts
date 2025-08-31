import nodemailer from "nodemailer";
import { renderTemplate } from "./templateLoader";
import { config } from "@konnected/config";

const transporter = nodemailer.createTransport({
  host: config.SMTP_HOST,
  port: config.SMPT_PORT,
  secure: false,
  auth: {
    user: config.SMTP_USER,
    pass: config.SMTP_PASS,
  },
});

export async function sendEmail(
  templateName: string,
  { to, subject, variables }: { to: string; subject: string; variables: Record<string, any> },
) {
  const html = renderTemplate(templateName, variables);

  return transporter.sendMail({
    from: `"Konnected" <no-reply@konnected.io>`,
    to,
    subject,
    html,
  });
}
