// POST /.netlify/functions/subscribe
// Step 1 of double opt-in: emails a signed confirmation link.
// Nothing is written to the database until the owner of the inbox confirms.

import { createConfirmToken, emailRef, isAllowedOrigin, json, normalizeEmail, readJsonBody } from '../../lib/shared.mjs';
import { sendConfirmationEmail } from '../../lib/email.mjs';
import { reserveConfirmationEmail } from '../../lib/throttle.mjs';

// Same answer whether the address is new, already subscribed or throttled,
// so the endpoint cannot be used to find out who is subscribed.
const ACCEPTED = { success: true, message: 'Check your inbox to confirm your subscription.' };

export default async (req) => {
  if (!isAllowedOrigin(req)) return json(403, { error: 'Forbidden' });

  const body = await readJsonBody(req);
  if (!body) return json(400, { error: 'Invalid request' });

  // Honeypot: real visitors never fill this hidden field.
  if (typeof body.website === 'string' && body.website.trim() !== '') {
    console.log('[subscribe] honeypot triggered');
    return json(200, ACCEPTED);
  }

  const email = normalizeEmail(body.email);
  if (!email) return json(400, { error: 'Invalid email address' });

  const ref = emailRef(email);
  try {
    const slot = await reserveConfirmationEmail(email);
    if (slot === 'daily-limit') {
      console.warn('[subscribe] daily email limit reached');
      return json(429, { error: 'Too many requests right now. Please try again tomorrow.' });
    }
    if (slot === 'cooldown') {
      console.log(`[subscribe] ${ref} cooldown, no email sent`);
      return json(200, ACCEPTED);
    }

    await sendConfirmationEmail(email, createConfirmToken(email));
    console.log(`[subscribe] ${ref} confirmation email sent`);
    return json(200, ACCEPTED);
  } catch (error) {
    console.error(`[subscribe] ${ref} failed:`, error.message);
    return json(500, { error: 'Subscription failed. Please try again.' });
  }
};

export const config = {
  method: 'POST',
  rateLimit: {
    action: 'rate_limit',
    aggregateBy: ['ip', 'domain'],
    windowSize: 60,
    windowLimit: 5,
  },
};
