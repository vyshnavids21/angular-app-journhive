const nodemailer = require('nodemailer');

// Cache the transporter so we don't recreate it on every request.
let transporterPromise = null;

/**
 * Build a nodemailer transporter.
 * - If real SMTP creds are configured in .env, use them.
 * - Otherwise fall back to an Ethereal test account (https://ethereal.email),
 *   which captures the message and gives us a preview URL — zero setup required
 *   for local development.
 */
async function getTransporter() {
  if (transporterPromise) return transporterPromise;

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporterPromise = Promise.resolve(
      nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false otherwise
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      })
    );
  } else {
    transporterPromise = nodemailer.createTestAccount().then((testAccount) => {
      console.warn(
        '[mailer] No SMTP creds found in .env — using Ethereal test inbox. ' +
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
 * Returns the Ethereal preview URL (or null when using real SMTP).
 */
async function sendResetEmail(toEmail, resetUrl) {
  const transporter = await getTransporter();

  const info = await transporter.sendMail({
    from: process.env.MAIL_FROM || '"JournHive" <no-reply@journhive.app>',
    to: toEmail,
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
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`[mailer] Password reset email preview: ${previewUrl}`);
  }
  return previewUrl || null;
}

module.exports = { sendResetEmail };
