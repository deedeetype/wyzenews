// Outgoing-email limits, stored in Netlify Blobs.
// Protects third parties from being mail-bombed through the signup form and
// protects the Gmail account from being suspended for abuse.

import { createHash } from 'node:crypto';
import { getStore } from '@netlify/blobs';

const PER_ADDRESS_COOLDOWN_MS = 15 * 60 * 1000; // 1 confirmation email per address per 15 min
const DAILY_GLOBAL_LIMIT = 200; // confirmation emails per day, all addresses combined

// Returns 'ok', 'cooldown' (this address was emailed recently) or 'daily-limit'.
export async function reserveConfirmationEmail(email, now = Date.now()) {
  const store = getStore('email-throttle');
  const addressKey = `addr/${createHash('sha256').update(email).digest('hex')}`;
  const dayKey = `day/${new Date(now).toISOString().slice(0, 10)}`;

  const last = Number(await store.get(addressKey)) || 0;
  if (now - last < PER_ADDRESS_COOLDOWN_MS) return 'cooldown';

  const sentToday = Number(await store.get(dayKey)) || 0;
  if (sentToday >= DAILY_GLOBAL_LIMIT) return 'daily-limit';

  await store.set(addressKey, String(now));
  await store.set(dayKey, String(sentToday + 1));
  return 'ok';
}
