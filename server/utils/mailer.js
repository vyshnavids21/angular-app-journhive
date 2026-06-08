const nodemailer = require('nodemailer');
const { Resend } = require('resend');

// Cache the nodemailer transporter so we don't recreate it on every request.
let transporterPromise = null;

// Single Resend client (only created if an API key is configured).
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// True when real SMTP creds (e.g. Gmail App Password) are configured.
const hasSmtp = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

// "From" address. For Gmail, the from MUST be your own Gmail address, so default to SMTP_USER.
const MAIL_FROM =
  process.env.MAIL_FROM ||
  (hasSmtp ? `JournHive <${process.env.SMTP_USER}>` : 'JournHive <onboarding@resend.dev>');

/**
 * Build the email subject/text/html once so every provider sends an identical message.
 */
function buildResetMessage(resetUrl) {
  return {
    subject: 'Reset your JournHive password',
    text:
      `You requested a password reset.\n\n` +
      `Click the link below to set a new password (valid for 1 hour):\n${resetUrl}\n\n` +
      `If you didn't request this, you can safely ignore this email.`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #4a6cf7;">Reset your password</h2>
        <p>You requested a password reset for your JournHive account.</p>
        <p>Click the button below to set a new password. This link is valid for <strong>1 hour</strong>.</p>
        <p style="text-align: center; margin: 28px 0;">
          <a href="${resetUrl}"
             style="background: #4a6cf7; color: #fff; padding: 12px 28px; border-radius: 10px;
                    text-decoration: none; font-weight: 600; display: inline-block;">
            Reset Password
          </a>
        </p>
        <p style="color: #6b6b78; font-size: 13px;">
          If the button doesn't work, copy this link into your browser:<br>
          <a href="${resetUrl}">${resetUrl}</a>
        </p>
        <p style="color: #6b6b78; font-size: 13px;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `
  };
}

/**
 * Build a nodemailer transporter.
 * - If real SMTP creds are configured (e.g. Gmail App Password), use them — this delivers
 *   to ANY recipient with no domain required.
 * - Otherwise fall back to an Ethereal test account (https://ethereal.email), which captures
 *   the message and gives us a preview URL — zero setup required for local development.
 */
async function getTransporter() {
  if (transporterPromise) return transporterPromise;

  if (hasSmtp) {
    transporterPromise = Promise.resolve(
      nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465, // true for 465 (SSL), false for 587 (STARTTLS)
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      })
    );
  } else {
    transporterPromise = nodemailer.createTestAccount().then((testAccount) => {
      console.warn(
        '[mailer] No SMTP creds or RESEND_API_KEY found in .env — using Ethereal test inbox. ' +
        'Reset emails will NOT reach real inboxes; open the preview URL printed below instead.'
      );
      return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass }
      });
    });
  }

  return transporterPromise;
}

/**
 * Send a password-reset email.
 *
 * Provider preference:
 *   1. SMTP (nodemailer)   — used when SMTP_HOST/USER/PASS are set (e.g. Gmail App Password).
 *                            Delivers to any recipient, no domain required. Preferred here.
 *   2. Resend (HTTP API)   — used when RESEND_API_KEY is set and SMTP is not. Needs a
 *                            verified domain to reach arbitrary recipients.
 *   3. Ethereal test inbox — local-dev fallback; returns a preview URL.
 *
 * Returns the Ethereal preview URL (or null when a real provider delivered the mail).
 */
async function sendResetEmail(toEmail, resetUrl) {
  const message = buildResetMessage(resetUrl);

  // 1. SMTP (Gmail etc.) takes priority — it works for any recipient with no domain.
  if (hasSmtp) {
    const transporter = await getTransporter();
    await transporter.sendMail({
      from: MAIL_FROM,
      to: toEmail,
      subject: message.subject,
      text: message.text,
      html: message.html
    });
    console.log(`[mailer] Password reset email sent via SMTP to ${toEmail}`);
    return null;
  }

  // 2. Resend (HTTP API).
  if (resend) {
    const { data, error } = await resend.emails.send({
      from: MAIL_FROM,
      to: toEmail,
      subject: message.subject,
      text: message.text,
      html: message.html
    });

    if (error) {
      // Surface the real reason (bad API key, unverified domain, etc.) instead of a generic 500.
      console.error('[mailer] Resend failed:', error);
      throw new Error(error.message || 'Resend failed to send the email');
    }

    console.log(`[mailer] Password reset email sent via Resend (id: ${data?.id})`);
    return null;
  }

  // 3. Ethereal dev fallback — returns a preview URL.
  const transporter = await getTransporter();
  const info = await transporter.sendMail({
    from: MAIL_FROM,
    to: toEmail,
    subject: message.subject,
    text: message.text,
    html: message.html
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`[mailer] Password reset email preview: ${previewUrl}`);
  }
  return previewUrl || null;
}

module.exports = { sendResetEmail };
