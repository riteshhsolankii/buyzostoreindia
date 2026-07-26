import { run } from "./database";

// Outbox persists in the database (email_outbox table) so sent mail can be
// inspected any time.
async function recordOutbox(email: {
  to: string;
  subject: string;
  text: string;
  sentAt: string;
  delivered: boolean;
}): Promise<void> {
  await run(
    `INSERT INTO email_outbox (to_email, subject, text, sent_at, delivered)
     VALUES (?, ?, ?, ?, ?)`,
    [
      email.to,
      email.subject,
      email.text,
      email.sentAt,
      email.delivered ? 1 : 0,
    ]
  );
}

/**
 * Outcome of a send attempt. `demo` and `failed` are deliberately distinct:
 * "no provider is configured" is a local-development state that callers can
 * accept, while "the provider rejected the request" is a real error that must
 * not be treated as a success.
 */
export type MailResult = "delivered" | "demo" | "failed";

/**
 * Sends a plain-text email. With RESEND_API_KEY set in .env.local it delivers
 * for real via the Resend HTTP API; without it we run in demo mode — the mail
 * is logged to the server console and kept in the outbox table.
 */
async function sendMail(
  to: string,
  subject: string,
  text: string
): Promise<MailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  let result: MailResult;

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
      if (!res.ok) {
        console.error(
          `[buyzo-mail] Resend rejected the send to ${to}: ${res.status} ${await res
            .text()
            .catch(() => "")}`
        );
      }
      result = res.ok ? "delivered" : "failed";
    } catch (error) {
      console.error(`[buyzo-mail] Resend request to ${to} threw:`, error);
      result = "failed";
    }
  } else {
    console.log(`[buyzo-mail] demo mode — would send to ${to}\nSubject: ${subject}\n${text}`);
    result = "demo";
  }

  await recordOutbox({
    to,
    subject,
    text,
    sentAt: new Date().toISOString(),
    delivered: result === "delivered",
  });
  return result;
}

export async function sendOtpEmail(
  to: string,
  code: string
): Promise<MailResult> {
  const subject = `${code} is your Buyzo verification code`;
  const text = [
    `Your Buyzo verification code is ${code}.`,
    "",
    "It expires in 10 minutes. Enter it on the sign-up page to finish creating",
    "your account.",
    "",
    "If you didn't request this, you can ignore this email — no account is",
    "created until the code is entered.",
    "",
    "— Team Buyzo",
  ].join("\n");
  return sendMail(to, subject, text);
}

/** Returns whether the mail actually left the building (demo mode counts as no). */
export async function sendWelcomeEmail(
  to: string,
  name: string
): Promise<boolean> {
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
  return (await sendMail(to, subject, text)) === "delivered";
}
