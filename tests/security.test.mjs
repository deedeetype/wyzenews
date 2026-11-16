// Security regression tests: node --test tests/
// No network access: Supabase, email and the throttle store are never reached.

import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.CONFIRM_SECRET = 'test-secret-test-secret-test-secret-test-secret';

const { createConfirmToken, verifyConfirmToken, normalizeEmail, isUuid, isAllowedOrigin } = await import('../lib/shared.mjs');
const { default: subscribe } = await import('../netlify/functions/subscribe.mjs');
const { default: confirm } = await import('../netlify/functions/confirm.mjs');
const { default: unsubscribe } = await import('../netlify/functions/unsubscribe.mjs');

const post = (body, headers = {}) =>
  new Request('https://wyzenews.com/.netlify/functions/x', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

test('confirm token round-trips', () => {
  assert.equal(verifyConfirmToken(createConfirmToken('a@example.com')), 'a@example.com');
});

test('confirm token: tampered, forged, expired and malformed are rejected', () => {
  const token = createConfirmToken('a@example.com');
  const [payload, signature] = token.split('.');
  const forged = Buffer.from(JSON.stringify({ e: 'victim@example.com', x: Date.now() + 1e6 })).toString('base64url');

  assert.equal(verifyConfirmToken(`${forged}.${signature}`), null);
  assert.equal(verifyConfirmToken(`${payload}.${signature.slice(0, -2)}AA`), null);
  assert.equal(verifyConfirmToken(createConfirmToken('a@example.com', Date.now() - 49 * 3600 * 1000)), null);
  for (const bad of ['', 'abc', 'a.b.c', null, undefined, 42, {}, 'x'.repeat(2000)]) {
    assert.equal(verifyConfirmToken(bad), null);
  }
});

test('email validation rejects header/HTML injection', () => {
  assert.equal(normalizeEmail('  User@Example.COM '), 'user@example.com');
  for (const bad of [
    'not-an-email',
    'a@b',
    'a@example.com\r\nBcc: x@evil.com',
    'a@example.com, b@evil.com',
    '"<script>"@example.com',
    '<a@example.com>',
    'a b@example.com',
    'a@exa mple.com',
    { email: 'a@example.com' },
    ['a@example.com'],
    null,
    `${'a'.repeat(250)}@example.com`,
  ]) {
    assert.equal(normalizeEmail(bad), null, `should reject ${JSON.stringify(bad)}`);
  }
});

test('uuid validation rejects HTML injection payloads', () => {
  assert.equal(isUuid('3f2b8c1e-9a4d-4e7b-8c2a-1d5e6f7a8b9c'), true);
  for (const bad of ['"><a href="https://evil.example">click</a>', '3f2b8c1e-9a4d-4e7b-8c2a-1d5e6f7a8b9c"><b>', '', null, {}]) {
    assert.equal(isUuid(bad), false);
  }
});

test('origin check', () => {
  const withOrigin = (origin) => post({}, origin ? { Origin: origin } : {});
  assert.equal(isAllowedOrigin(withOrigin('https://wyzenews.com')), true);
  assert.equal(isAllowedOrigin(withOrigin('https://deploy-preview-3--wyzenews.netlify.app')), true);
  assert.equal(isAllowedOrigin(withOrigin(null)), true);
  assert.equal(isAllowedOrigin(withOrigin('https://evil.example')), false);
  assert.equal(isAllowedOrigin(withOrigin('https://wyzenews.com.evil.example')), false);
  assert.equal(isAllowedOrigin(withOrigin('https://evil--wyzenews.netlify.app.evil.example')), false);
});

test('subscribe: rejects foreign origins, bad bodies and bad emails before doing any work', async () => {
  assert.equal((await subscribe(post({ email: 'a@example.com' }, { Origin: 'https://evil.example' }))).status, 403);
  assert.equal((await subscribe(post('not json'))).status, 400);
  assert.equal((await subscribe(post('[]'))).status, 400);
  assert.equal((await subscribe(post({ email: 'nope' }))).status, 400);
  assert.equal((await subscribe(post({ email: 'a@example.com\nBcc: x@evil.com' }))).status, 400);
  assert.equal((await subscribe(post({ email: 'a@example.com', pad: 'x'.repeat(3000) }))).status, 400);
});

test('subscribe: honeypot is silently accepted without sending anything', async () => {
  const res = await subscribe(post({ email: 'bot@example.com', website: 'https://spam.example' }));
  assert.equal(res.status, 200);
  assert.equal((await res.json()).success, true);
});

test('confirm: rejects missing and forged tokens', async () => {
  assert.equal((await confirm(post({}))).status, 400);
  assert.equal((await confirm(post({ token: 'abc.def' }))).status, 400);
  assert.equal((await confirm(post({ token: { $ne: null } }))).status, 400);
  assert.equal((await confirm(post({ token: createConfirmToken('a@example.com') }, { Origin: 'https://evil.example' }))).status, 403);
});

test('unsubscribe: rejects anything that is not a UUID', async () => {
  assert.equal((await unsubscribe(post({}))).status, 400);
  assert.equal((await unsubscribe(post({ token: 'abc' }))).status, 400);
  assert.equal((await unsubscribe(post({ token: '*' }))).status, 400);
  assert.equal((await unsubscribe(post({ token: ['3f2b8c1e-9a4d-4e7b-8c2a-1d5e6f7a8b9c'] }))).status, 400);
});
