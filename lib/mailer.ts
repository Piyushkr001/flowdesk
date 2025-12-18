import nodemailer from "nodemailer";

export async function sendInviteEmail(opts: { to: string; name: string; inviteUrl: string }) {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    throw new Error("Missing SMTP_USER or SMTP_PASS in env.");
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: false,
    auth: { user, pass },
  });

  const from = process.env.MAIL_FROM || user;

  await transporter.sendMail({
    from,
    to: opts.to,
    subject: "You’re invited to join the workspace",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>Hi ${opts.name},</h2>
        <p>You’ve been invited to join our workspace.</p>
        <p>
          <a href="${opts.inviteUrl}"
             style="display:inline-block;padding:10px 14px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;">
            Accept Invite
          </a>
        </p>
        <p>If the button doesn’t work, open this link:</p>
        <p><a href="${opts.inviteUrl}">${opts.inviteUrl}</a></p>
      </div>
    `,
  });
}
