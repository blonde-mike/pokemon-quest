# Supabase Setup Guide for Pokemon Quest

## Quick Setup Checklist

- [ ] Create Supabase project
- [ ] Run database schema
- [ ] **Disable email confirmation** (important!)
- [ ] Get anon public key
- [ ] Configure environment variables

---

## Step 1: Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in:
   - **Name**: `pokemon-quest`
   - **Database Password**: Generate strong password (save it!)
   - **Region**: Choose closest to your users
4. Click "Create new project"
5. Wait 2-3 minutes for setup

---

## Step 2: Disable Email Confirmation

⚠️ **IMPORTANT**: By default, Supabase requires email confirmation for signups. This breaks the game flow.

### Disable It:

1. Go to **Authentication** → **Providers** → **Email**
2. Scroll to **"Confirm email"** setting
3. **Uncheck** "Enable email confirmations"
4. Click **Save**

Why: This allows users to play immediately after signup without checking email.

---

## Step 3: Run Database Schema

1. Go to **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Open `DATABASE_SCHEMA.md` from this repo
4. Copy **entire file** contents (~400 lines)
5. Paste into SQL editor
6. Click **"Run"** (or Cmd/Ctrl + Enter)
7. Should see: "Success. No rows returned"

### Verify Tables Created:

Go to **Table Editor** and check these tables exist:
- `profiles`
- `pokemon_species` (should have 9 rows)
- `user_pokemon`
- `battles`
- `battle_participants`
- `trades`
- `items` (should have 6 rows)
- `user_inventory`

---

## Step 4: Get API Keys

1. Go to **Settings** → **API**
2. You'll see two keys:

### ✅ Use This One (anon public):
- Label: **"anon public"**
- Starts with: `eyJh...` or `eyJ...`
- Length: ~250 characters
- **Copy this key!**

### ❌ Never Use This (service_role):
- Label: **"service_role"**
- Starts with: `eyJh...` (service role JWT)
- **DO NOT use in browser code!**

---

## Step 5: Configure Environment Variables

### Local Development (`.env.local`):

```env
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=eyJh...your-anon-key-here
```

Replace:
- `YOUR_PROJECT_REF` with your project reference (from URL)
- `eyJh...your-anon-key-here` with the anon public key you copied

### Vercel Deployment:

If using Vercel's Supabase integration, it auto-sets:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Otherwise, add them manually in **Vercel Dashboard** → **Settings** → **Environment Variables**

---

## Step 6: Test Locally

```bash
npm run dev
```

Visit `http://localhost:3000` and test:
1. Click "START ADVENTURE"
2. Sign up with email/password
3. Should go directly to trainer setup (no email check)
4. Choose trainer name and starter
5. Should load game dashboard

---

## Troubleshooting

### "Not Authenticated" After Signup

**Cause**: Email confirmation is still enabled

**Fix**:
1. Supabase → Authentication → Providers → Email
2. Uncheck "Enable email confirmations"
3. Save
4. Try signing up again with different email

### "Forbidden use of secret API key"

**Cause**: Using `service_role` key instead of `anon` key

**Fix**:
1. Go back to Settings → API
2. Copy the **"anon public"** key (starts with `eyJ`)
3. Update your `.env.local` file
4. Restart dev server

### "Pokemon species not found"

**Cause**: Database schema seed data didn't run

**Fix**:
1. Go to SQL Editor
2. Run just the seed data section from `DATABASE_SCHEMA.md`:
   - The INSERT statements for `pokemon_species`
   - The INSERT statements for `items`
   - The UPDATE statements for evolution chains

### "Cannot read properties of null"

**Cause**: Profile or Pokemon not created properly

**Fix**:
1. Check Table Editor → `profiles` for your user
2. Check Table Editor → `user_pokemon` for starter
3. If missing, try a fresh signup with new email
4. Or manually insert test data

---

## Security Notes

### Row Level Security (RLS)

All tables have RLS enabled. Users can only:
- View their own Pokemon, profile, inventory
- View all Pokemon species (read-only)
- View all items (read-only)
- Participate in trades with consent

### Keys Safety

- ✅ `anon` key: Safe in browser, respects RLS
- ❌ `service_role` key: Server-only, bypasses RLS

Never commit keys to Git! Always use `.env.local` (in `.gitignore`)

---

## Optional: Email Templates

If you want to enable email confirmation later:

1. Authentication → Email Templates
2. Customize:
   - Confirm signup template
   - Magic link template
   - Password reset template
3. Set redirect URLs to your domain

---

## Database Maintenance

### Backup

Supabase auto-backs up daily:
- Free tier: 7 days retention
- Pro tier: 30 days retention

Manual backup:
```bash
# Requires psql installed
pg_dump -h db.YOUR_PROJECT_REF.supabase.co -U postgres -d postgres > backup.sql
```

### Monitor Usage

Dashboard → Usage tab shows:
- Database size
- Bandwidth used
- API requests
- Active users

---

## Need Help?

- **Supabase Docs**: https://supabase.com/docs
- **Pokemon Quest Issues**: https://github.com/blonde-mike/pokemon-quest/issues
- **Supabase Discord**: https://discord.supabase.com

---

## Quick Reference

| Setting | Location | Value |
|---------|----------|-------|
| Email Confirmation | Auth → Providers → Email | **Disabled** ✓ |
| Site URL | Auth → URL Configuration | Your domain |
| RLS | Database → Tables | **Enabled** on all tables ✓ |
| Anon Key | Settings → API | Starts with `eyJ...` |

---

**Ready to play!** 🎮

Once setup is complete, your Pokemon Quest should work perfectly for signup → starter selection → gameplay.
