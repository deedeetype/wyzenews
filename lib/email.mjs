// Email sending (Gmail SMTP). Not an HTTP endpoint: only called by the functions.
// Every dynamic value placed in an email is built server-side from validated data.

import nodemailer from 'nodemailer';
import { SITE_URL, isUuid } from './shared.mjs';

const FROM = '"WyzeNews" <noreply@wyzenews.com>';

function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) throw new Error('Email service not configured');
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: { user, pass },
  });
}

function layout({ title, bodyHtml, footerHtml = '' }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;line-height:1.6;color:#e0e0e0;background-color:#0f0f1e;margin:0;padding:20px;">
  <div style="max-width:600px;margin:0 auto;background:#1e1e3f;border-radius:16px;overflow:hidden;">
    <div style="background:#667eea;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:40px 30px;text-align:center;">
      <img src="${SITE_URL}/assets/WyzeNewsLogo.png" alt="WyzeNews Logo" style="width:180px;max-width:80%;height:auto;margin-bottom:20px;">
      <h1 style="color:#ffffff;font-size:28px;margin:0;">${title}</h1>
    </div>
    <div style="padding:40px 30px;color:#b8b8d1;font-size:16px;">
      ${bodyHtml}
    </div>
    <div style="background-color:#0f0f1e;padding:20px 30px;text-align:center;font-size:14px;color:#7a7a9e;">
      <p style="margin:0;"><strong>WyzeNews</strong> by <a href="https://labwyze.com" style="color:#667eea;text-decoration:none;">Labwyze Inc.</a></p>
      ${footerHtml}
    </div>
  </div>
</body>
</html>`;
}

const BUTTON_STYLE =
  'display:inline-block;padding:14px 32px;background:#667eea;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;';

// Step 1 of double opt-in. `token` is a signed token created by createConfirmToken().
export async function sendConfirmationEmail(email, token) {
  const confirmUrl = `${SITE_URL}/confirm?token=${encodeURIComponent(token)}`;

  const html = layout({
    title: 'Confirm your subscription',
    bodyHtml: `
      <p>Someone asked to subscribe this address to the WyzeNews daily digest.</p>
      <p>If that was you, please confirm:</p>
      <p style="text-align:center;margin:30px 0;"><a href="${confirmUrl}" style="${BUTTON_STYLE}">Confirm my subscription</a></p>
      <p style="color:#8b8ba7;font-size:14px;">This link expires in 48 hours. If you did not request this, ignore this email: you will not be subscribed and will not hear from us again.</p>`,
  });

  const text = `Confirm your WyzeNews subscription

Someone asked to subscribe this address to the WyzeNews daily digest.
If that was you, confirm here (link valid 48 hours):
${confirmUrl}

If you did not request this, ignore this email: you will not be subscribed.

---
WyzeNews by Labwyze Inc.`;

  await getTransporter().sendMail({
    from: FROM,
    to: email,
    subject: 'Confirm your WyzeNews subscription',
    text,
    html,
  });
}

// Step 2: sent once the address is confirmed. `unsubscribeToken` comes from the database.
export async function sendWelcomeEmail(email, unsubscribeToken) {
  if (!isUuid(unsubscribeToken)) throw new Error('Invalid unsubscribe token');
  const unsubscribeUrl = `${SITE_URL}/unsubscribe?token=${unsubscribeToken}`;

  const html = layout({
    title: 'Welcome to WyzeNews!',
    bodyHtml: `
      <h2 style="color:#ffffff;font-size:22px;margin:0 0 20px 0;">Thanks for subscribing!</h2>
      <p>You're all set to receive your daily digest of breaking news with stunning comic strip visuals.</p>
      <div style="background:#2c2c5a;border-left:4px solid #667eea;padding:15px 20px;margin:20px 0;border-radius:8px;color:#ffffff;">
        <strong>What you'll get:</strong><br>
        &bull; 3 curated breaking news stories daily<br>
        &bull; Concise, factual summaries<br>
        &bull; Unique comic strip illustrations<br>
        &bull; Delivered daily to your inbox
      </div>
      <p>Please check your <strong>Spam/Junk</strong> folder if you don't see our emails, and add <strong>noreply@wyzenews.com</strong> to your contacts.</p>
      <p style="text-align:center;margin:30px 0;"><a href="${SITE_URL}" style="${BUTTON_STYLE}">Visit WyzeNews</a></p>`,
    footerHtml: `<p style="margin:15px 0 0 0;font-size:12px;"><a href="${unsubscribeUrl}" style="color:#667eea;text-decoration:none;">Unsubscribe</a></p>`,
  });

  const text = `Welcome to WyzeNews!

Thanks for subscribing! You're all set to receive your daily digest of breaking news with comic strip visuals.

What you'll get:
- 3 curated breaking news stories daily
- Concise, factual summaries
- Unique comic strip illustrations

Unsubscribe at any time:
${unsubscribeUrl}

---
WyzeNews by Labwyze Inc.`;

  await getTransporter().sendMail({
    from: FROM,
    to: email,
    subject: 'Welcome to WyzeNews - Your Daily News Digest',
    text,
    html,
    headers: { 'List-Unsubscribe': `<${unsubscribeUrl}>` },
  });
}
