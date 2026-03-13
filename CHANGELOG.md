# WyzeNews - Changelog

## v1.1.0-gpt5-long-summaries (March 12, 2026) 🎯

**PRODUCTION READY - Complete automation with dual summaries**

### ✨ New Features

#### GPT-5.4 Integration via Poe API
- Replaced Gemini 2.5-Flash with GPT-5.4 for text summarization
- Generates TWO summaries per story:
  - **Short summary** (150-200 chars) for email newsletters
  - **Long summary** (900-1000 chars) for web pages with context, implications, timeline
- More detailed, structured content for web readers
- Better quality summaries with richer context

#### OpenClaw Cron Automation
- Daily automatic execution at 7:00 AM ET
- Full pipeline runs without manual intervention
- Automatic Telegram notification after completion
- Job ID: `1e4951bb-773f-4a41-85ee-2b35d0825b9e`
- Isolated session execution (agentTurn payload)

#### Re-subscription Support
- Users who unsubscribe can now re-subscribe
- System updates `active` flag from false → true
- Modified `functions/subscribe.js` to handle existing users

#### Welcome Email Improvements
- Fixed Gmail readability (darker background, white text)
- Removed "Powered by Perplexity AI & Google Gemini" branding
- Changed "AI-generated" to "stunning" in description
- Added "Visit WyzeNews" button linking to homepage

### 🔧 Bug Fixes

#### Web Page Summary Display
- **Bug:** Long summaries weren't showing on web pages (empty div)
- **Root cause:** `6_publish_to_web.py` wasn't passing `summary_long` to template
- **Fix:** Added `summary_long` to template data dictionary
- **Result:** Web pages now display 900+ char detailed summaries

#### Git Conflicts During Push
- Issue: Multiple concurrent commits creating merge conflicts
- Solution: Reset to origin/main, regenerate, then push clean

### 🏗️ Architecture Changes

#### Summarization Pipeline
```
Old: google.generativeai (Gemini 2.5-Flash)
     ↓
     summary_enhanced (one version)

New: Poe API (GPT-5.4)
     ↓
     summary_short (email) + summary_long (web) + key_takeaways
```

#### File Structure
- `scripts/2_summarize.py` → New Poe API version
- `scripts/2_summarize_gemini.py.bak` → Backup of old version
- `.env.poe` → Poe API credentials (chmod 600)

### 📊 Performance

**Runtime per digest:** ~3 minutes
- Fetch: ~5s
- Summarize: ~30s (3 stories × GPT-5.4)
- Images: ~90s (3 images × Gemini)
- Email/Publish/Push: ~30s

**API Costs:** ~$0.02-0.05 per digest
- Perplexity: Via OpenClaw (existing budget)
- GPT-5.4: ~15k input + 2k output tokens
- Gemini Image: Free (preview period)

### 🔐 Security

- Poe API key secured in `.env.poe` (600 permissions)
- Supabase credentials passed via environment variables in cron
- Google Workspace app password in `.email-credentials.json` (600)

---

## v1.0.0-phase3-complete (March 12, 2026)

**Initial production release**

### Features
- 7-script pipeline (fetch → summarize → images → email → publish → push)
- Gemini 2.5-Flash for summarization (single summary version)
- Gemini Image for comic strips
- Google Workspace SMTP (noreply@wyzenews.com)
- Landing page with subscription form
- Supabase database for subscribers
- Individual shareable breaking pages with Open Graph
- Mobile-responsive email template
- Social share buttons (Facebook, LinkedIn, Pinterest)
- Unsubscribe flow
- Custom domain: wyzenews.com

**Restore point:** Commit `1f5311f`

---

## Upgrade Path

### v1.0.0 → v1.1.0

**No breaking changes!** All existing data compatible.

**To upgrade:**
1. Pull latest from GitHub
2. Add `.env.poe` with Poe API key
3. Update cron job or use OpenClaw cron
4. Done!

**To rollback:**
```bash
git checkout v1.0.0-phase3-complete
mv scripts/2_summarize_gemini.py.bak scripts/2_summarize.py
```

---

## Future Roadmap

### v1.2.0 (Planned)
- [ ] Migrate to `google.genai` (new Gemini package)
- [ ] Archive page with full digest history
- [ ] Analytics (Google Analytics or Plausible)
- [ ] A/B testing for subject lines
- [ ] Subscriber preferences (topics, frequency)

### v2.0.0 (Ideas)
- [ ] Multiple languages support
- [ ] Video summaries (TTS + images)
- [ ] Podcast version
- [ ] Custom topic selection per subscriber
- [ ] AI chat interface on web pages

---

**Current Status:** 🎯 v1.1.0 - Production & Automated
