import { getDatabase } from "./database";

// Outbox persists in the SQLite database (email_outbox table) so sent mail can
// be inspected any time.
function recordOutbox(email: {
  to: string;
  subject: string;
  text: string;
  sentAt: string;
  delivered: boolean;
}): void {
  getDatabase()
    .prepare(
      `INSERT INTO email_outbox (to_email, subject, text, sent_at, delivered)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(email.to, email.subject, email.text, email.sentAt, email.delivered ? 1 : 0);
}

/**
 * Sends a plain-text email. With RESEND_API_KEY set in .env.local it delivers
 * for real via the Resend HTTP API; without it we run in demo mode — the mail
 * is logged to the server console and kept in the in-memory outbox.
 */
async function sendMail(to: string, subject: string, text: string): Promise<boolean> {
  let delivered = false;
  const apiKey = process.env.RESEND_API_KEY;

  if (apiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.MAIL_FROM ?? "Buyzo <onboarding@resend.dev>",
          to,
          subject,
          text,
        }),
      });
      delivered = res.ok;
    } catch {
      delivered = false;
    }
  } else {
    console.log(`[buyzo-mail] demo mode — would send to ${to}\nSubject: ${subject}\n${text}`);
  }

  recordOutbox({ to, subject, text, sentAt: new Date().toISOString(), delivered });
  return delivered;
}

export async function sendWelcomeEmail(to: string, name: string): Promise<boolean> {
  const subject = "Welcome to Buyzo 🎉";
  const text = [
    `Hi ${name},`,
    "",
    "Welcome to Buyzo — your account is ready!",
    "Shop More. Pay Less. Live Better.",
    "",
    "Browse the latest deals any time in the shop.",
    "",
    "— Team Buyzo",
  ].join("\n");
  return sendMail(to, subject, text);
}
