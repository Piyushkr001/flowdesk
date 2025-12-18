import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function noStoreJson(data: any, status = 200) {
  const res = NextResponse.json(data, { status });
  res.headers.set("Cache-Control", "no-store");
  return res;
}

function pickEnv(name: string) {
  const v = process.env[name];
  return typeof v === "string" ? v.trim() : "";
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const subject = typeof body?.subject === "string" ? body.subject.trim() : "New contact message";
    const message = typeof body?.message === "string" ? body.message.trim() : "";

    if (!name) return noStoreJson({ message: "Name is required." }, 400);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return noStoreJson({ message: "Valid email is required." }, 400);
    if (!message) return noStoreJson({ message: "Message is required." }, 400);

    const SMTP_HOST = pickEnv("SMTP_HOST");
    const SMTP_PORT = Number(pickEnv("SMTP_PORT") || "587");
    const SMTP_USER = pickEnv("SMTP_USER");
    const SMTP_PASS = pickEnv("SMTP_PASS");

    const CONTACT_TO = pickEnv("CONTACT_TO") || SMTP_USER;
    const CONTACT_FROM_EMAIL = pickEnv("CONTACT_FROM_EMAIL") || SMTP_USER;
    const CONTACT_FROM_NAME = pickEnv("CONTACT_FROM_NAME") || "Contact Form";

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      return noStoreJson(
        {
          message:
            "Server email is not configured. Missing SMTP_HOST/SMTP_USER/SMTP_PASS in .env.local.",
        },
        500
      );
    }

    // Gmail: port 587 + STARTTLS (secure=false, requireTLS=true)
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: false,
      requireTLS: true,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    // Important for Gmail: "from" should be your authenticated account,
    // put the user's email in replyTo.
    const html = `
      <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto;">
        <h2>New Contact Message</h2>
        <p><b>Name:</b> ${escapeHtml(name)}</p>
        <p><b>Email:</b> ${escapeHtml(email)}</p>
        <p><b>Subject:</b> ${escapeHtml(subject)}</p>
        <hr />
        <p style="white-space: pre-wrap;">${escapeHtml(message)}</p>
      </div>
    `;

    await transporter.sendMail({
      to: CONTACT_TO,
      from: `${CONTACT_FROM_NAME} <${CONTACT_FROM_EMAIL}>`,
      replyTo: email,
      subject: `[Contact] ${subject}`,
      html,
    });

    return noStoreJson({ ok: true, message: "Message sent successfully." }, 200);
  } catch (err: any) {
    const code = err?.code || "";
    const responseCode = err?.responseCode;

    // Make Gmail auth errors understandable from the UI
    if (code === "EAUTH" || responseCode === 535) {
      return noStoreJson(
        {
          message:
            "Email authentication failed (Gmail rejected login). Use a Google App Password (2-Step Verification required), not your normal Gmail password.",
          code,
          responseCode,
        },
        500
      );
    }

    console.error("[/api/v1/contact] error:", err);
    return noStoreJson({ message: "Failed to send message.", code }, 500);
  }
}

// minimal HTML escaping (prevents injection in email)
function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
