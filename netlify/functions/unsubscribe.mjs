// POST /api/unsubscribe
// Marks a subscriber inactive, based on the unsubscribe token from their emails.

import { getSupabase, isAllowedOrigin, isUuid, json, readJsonBody } from '../../lib/shared.mjs';

export default async (req) => {
  if (!isAllowedOrigin(req)) return json(403, { error: 'Forbidden' });

  const body = await readJsonBody(req);
  const token = body ? body.token : null;
  if (!isUuid(token)) {
    return json(400, { error: 'Invalid unsubscribe link.' });
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('digest_subscribers')
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq('unsubscribe_token', token)
      .select('id');
    if (error) throw new Error(error.message);

    if (!data || data.length === 0) {
      return json(404, { error: 'Invalid unsubscribe link.' });
    }

    console.log('[unsubscribe] subscriber deactivated');
    return json(200, { success: true, message: 'Successfully unsubscribed' });
  } catch (error) {
    console.error('[unsubscribe] failed:', error.message);
    return json(500, { error: 'Unsubscribe failed. Please try again or contact support.' });
  }
};

export const config = {
  path: '/api/unsubscribe',
  method: 'POST',
  rateLimit: {
    action: 'rate_limit',
    aggregateBy: ['ip', 'domain'],
    windowSize: 60,
    windowLimit: 10,
  },
};
