// Shared helpers for the Netlify functions. This folder is NOT published.

import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

export const SITE_URL = 'https://wyzenews.com';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@<>"'\\,;:()[\]]+@[a-z0-9-]+(\.[a-z0-9-]+)+$/i;
const CONFIRM_TTL_MS = 48 * 60 * 60 * 1000;

export function isUuid(value) {
  return typeof value === 'string' && UUID_RE.test(value);
}

export function normalizeEmail(value) {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  if (email.length < 6 || email.length > 254 || !EMAIL_RE.test(email)) return null;
  return email;
}

// Never write email addresses to the logs; use a short hash to correlate events.
export function emailRef(email) {
  return createHash('sha256').update(email).digest('hex').slice(0, 10);
}

export function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

// Server-side client. Uses the service role key, which never leaves the functions,
// so the public (anon) role needs NO access to the subscribers table.
export function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.SUPABASE_DATABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase credentials not configured');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

// Browsers always send Origin on cross-site POSTs: refuse other websites.
export function isAllowedOrigin(req) {
  const origin = req.headers.get('origin');
  if (!origin) return true; // non-browser client: covered by rate limits and double opt-in
  try {
    const host = new URL(origin).hostname;
    return (
      host === 'wyzenews.com' ||
      host === 'www.wyzenews.com' ||
      host === 'wyzenews.netlify.app' ||
      host.endsWith('--wyzenews.netlify.app') ||
      host === 'localhost'
    );
  } catch {
    return false;
  }
}

export async function readJsonBody(req) {
  const text = await req.text();
  if (text.length > 2000) return null;
  try {
    const body = JSON.parse(text);
    return body && typeof body === 'object' && !Array.isArray(body) ? body : null;
  } catch {
    return null;
  }
}

// --- Double opt-in tokens -------------------------------------------------
// Stateless: the confirmation link carries the email + expiry, signed with a
// server-side secret. Nothing is stored until the owner of the inbox confirms.

function sign(payload) {
  const secret = process.env.CONFIRM_SECRET;
  if (!secret || secret.length < 32) throw new Error('CONFIRM_SECRET not configured');
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function createConfirmToken(email, now = Date.now()) {
  const payload = Buffer.from(JSON.stringify({ e: email, x: now + CONFIRM_TTL_MS })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

// Returns the confirmed email, or null if the token is forged, malformed or expired.
export function verifyConfirmToken(token, now = Date.now()) {
  if (typeof token !== 'string' || token.length > 1000) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, signature] = parts;
  const expected = Buffer.from(sign(payload));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (typeof data.x !== 'number' || data.x < now) return null;
    return normalizeEmail(data.e);
  } catch {
    return null;
  }
}
