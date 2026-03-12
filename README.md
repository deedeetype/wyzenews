# Daily Digest - Landing Page

Subscription landing page for the Daily Digest newsletter.

## 🎨 Features

- Modern dark mode design
- Email subscription form
- Netlify Functions for backend
- Supabase database integration
- Responsive & mobile-friendly
- Preview of digest format

## 🚀 Deployment

### Prerequisites

1. **Supabase Database Setup:**
   ```sql
   CREATE TABLE digest_subscribers (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     email TEXT UNIQUE NOT NULL,
     subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     active BOOLEAN DEFAULT TRUE,
     source TEXT DEFAULT 'landing_page',
     unsubscribe_token UUID DEFAULT gen_random_uuid(),
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Create index for faster email lookups
   CREATE INDEX idx_digest_subscribers_email ON digest_subscribers(email);
   CREATE INDEX idx_digest_subscribers_active ON digest_subscribers(active);
   ```

2. **Netlify Account** (free tier is fine)

3. **GitHub Repository** (optional, for auto-deploy)

### Deploy to Netlify

#### Option 1: Netlify CLI

```bash
# Install Netlify CLI (if not already)
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy from this directory
cd /data/.openclaw/workspace/business/daily-digest-landing
netlify deploy --prod
```

#### Option 2: GitHub + Netlify Auto-deploy

1. Push this folder to GitHub
2. Connect GitHub repo to Netlify
3. Netlify auto-builds on every push

### Environment Variables

Set these in Netlify Dashboard → Site Settings → Environment Variables:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

Get these from your Supabase project settings.

## 🧪 Local Testing

```bash
# Serve locally
python3 -m http.server 8000

# Open in browser
open http://localhost:8000
```

Note: Netlify Functions won't work locally without `netlify dev`. For full local testing:

```bash
npm install
netlify dev
```

## 📁 Structure

```
daily-digest-landing/
├── index.html           # Main landing page
├── style.css            # Styles (dark mode, responsive)
├── app.js               # Client-side form handling
├── netlify.toml         # Netlify config
├── package.json         # Dependencies
├── functions/
│   └── subscribe.js     # Serverless function (saves to Supabase)
└── README.md
```

## 🔗 Links

- **Live Site:** (set after deployment)
- **Supabase Dashboard:** https://supabase.com/dashboard
- **Netlify Dashboard:** https://app.netlify.com

## 📋 TODO (Phase 2)

- [ ] Deploy to Netlify
- [ ] Set up custom domain (e.g., digest.labwyze.com)
- [ ] Add unsubscribe page
- [ ] Add privacy policy page
- [ ] Email confirmation workflow
- [ ] Analytics tracking

---

**Created:** 2026-03-12  
**Owner:** David @ Labwyze Inc.
