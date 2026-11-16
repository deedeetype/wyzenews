// POST /api/confirm
// Step 2 of double opt-in: verifies the signed token from the confirmation email,
// then creates (or reactivates) the subscriber.

import { emailRef, getSupabase, isAllowedOrigin, json, readJsonBody, verifyConfirmToken } from '../../lib/shared.mjs';
import { sendWelcomeEmail } from '../../lib/email.mjs';

export default async (req) => {
  if (!isAllowedOrigin(req)) return json(403, { error: 'Forbidden' });

  const body = await readJsonBody(req);
  const email = body ? verifyConfirmToken(body.token) : null;
  if (!email) {
    return json(400, { error: 'This confirmation link is invalid or has expired. Please subscribe again.' });
  }

  const ref = emailRef(email);
  try {
    const supabase = getSupabase();

    const { data: existing, error: findError } = await supabase
      .from('digest_subscribers')
      .select('id, active, unsubscribe_token')
      .eq('email', email)
      .maybeSingle();
    if (findError) throw new Error(`lookup: ${findError.message}`);

    let subscriber = existing;
    let sendWelcome = false;

    if (!existing) {
      const { data: created, error: insertError } = await supabase
        .from('digest_subscribers')
        .insert({ email, active: true, source: 'landing_page', subscribed_at: new Date().toISOString() })
        .select('id, active, unsubscribe_token')
        .single();
      if (insertError) throw new Error(`insert: ${insertError.message}`);
      subscriber = created;
      sendWelcome = true;
      console.log(`[confirm] ${ref} subscribed`);
    } else if (!existing.active) {
      const { error: updateError } = await supabase
        .from('digest_subscribers')
        .update({ active: true, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
      if (updateError) throw new Error(`reactivate: ${updateError.message}`);
      sendWelcome = true;
      console.log(`[confirm] ${ref} reactivated`);
    } else {
      console.log(`[confirm] ${ref} already active`);
    }

    if (sendWelcome) {
      try {
        await sendWelcomeEmail(email, subscriber.unsubscribe_token);
      } catch (mailError) {
        // The subscription itself succeeded: do not fail the request.
        console.error(`[confirm] ${ref} welcome email failed:`, mailError.message);
      }
    }

    return json(200, { success: true });
  } catch (error) {
    console.error(`[confirm] ${ref} failed:`, error.message);
    return json(500, { error: 'Confirmation failed. Please try again.' });
  }
};

export const config = {
  path: '/api/confirm',
  method: 'POST',
  rateLimit: {
    action: 'rate_limit',
    aggregateBy: ['ip', 'domain'],
    windowSize: 60,
    windowLimit: 10,
  },
};
