# Daily Digest - Landing Page

Subscription landing page for the Daily Digest newsletter.

## 🎨 Features

- Modern dark mode design
- Email subscription form
- Netlify Functions for backend
- Supabase database integration
- Responsive & mobile-friendly
- Preview of digest format

## Architecture

```
index.html, archive.html, privacy.html, unsubscribe.html, confirm.html, 404.html
style.css, app.js, digest.js, archive.js, unsubscribe.js, confirm.js, robots.txt
assets/, breaking/          -> public files (copied to dist/ by the build)
scripts/build.mjs           -> builds dist/ (allowlist), sitemap.xml, _headers, SRI
netlify/functions/          -> subscribe, confirm, unsubscribe (never published)
lib/                        -> shared code, email sending, throttling (never published)
supabase/                   -> schema and migrations (never published)
tests/                      -> security regression tests (`npm test`)
```

Only `dist/` is published. A new public file must be added to the allowlist in
`scripts/build.mjs`, otherwise it will not be on the website.

## Subscription flow (double opt-in)

1. `POST /.netlify/functions/subscribe` emails a signed confirmation link (valid 48 h). Nothing is stored yet.
2. The visitor clicks the link (`/confirm?token=...`), which calls `POST /.netlify/functions/confirm`.
   The subscriber is created or reactivated, and the welcome email is sent.
3. `POST /.netlify/functions/unsubscribe` deactivates a subscriber from the link in every email.

Protections: per-IP rate limits, 1 confirmation email per address per 15 minutes,
200 confirmation emails per day in total, honeypot field, origin check.

## Environment variables (Netlify dashboard)

| Variable | Used for |
|---|---|
| `SUPABASE_DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | database access from the functions |
| `GMAIL_USER`, `GMAIL_APP_PASSWORD` | sending email |
| `CONFIRM_SECRET` | signing the confirmation links |

The database must be locked down with `supabase/2026-11-16_lock_down_subscribers.sql`.

## Commands

```bash
npm install
npm test        # security tests
npm run build   # builds dist/
netlify dev     # local site + functions
```

Pushing to `main` deploys to production.
