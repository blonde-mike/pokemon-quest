# Pokemon Quest - Deployment Guide

Complete guide for deploying Pokemon Quest to Vercel with Supabase backend.

## Prerequisites

- [Supabase](https://supabase.com) account
- [Vercel](https://vercel.com) account
- Git repository (GitHub, GitLab, or Bitbucket)

## Part 1: Supabase Setup

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in:
   - **Name**: pokemon-quest (or your choice)
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier works great
4. Click "Create new project"
5. Wait 2-3 minutes for setup

### 1.2 Run Database Schema

1. Open your Supabase project dashboard
2. Click "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy **entire contents** of `DATABASE_SCHEMA.md` from this repo
5. Paste into SQL editor
6. Click "Run" (or press Cmd/Ctrl + Enter)
7. Verify success (should show "Success. No rows returned")

### 1.3 Verify Database Setup

1. Go to "Table Editor"
2. Check these tables exist:
   - `profiles`
   - `pokemon_species`
   - `user_pokemon`
   - `battles`
   - `battle_participants`
   - `trades`
   - `items`
   - `user_inventory`

3. Check `pokemon_species` has data:
   - Should have 9 Pokemon (3 starters + evolutions each)
   - Flameling, Blazard, Infernix, Aquapup, Hydrohound, Tsunamax, Leafling, Vinebeast, Floratitan

4. Check `items` has data:
   - Should have 6 items (Potions, Pokeballs, etc.)

### 1.4 Get API Credentials

1. Go to "Project Settings" (gear icon)
2. Click "API" in sidebar
3. Copy these values (you'll need them):
   - **Project URL**: `https://[your-project-ref].supabase.co`
   - **anon public key**: `eyJ...` (long string starting with eyJ)

⚠️ **Keep these secure!** Don't commit them to Git.

### 1.5 Enable Realtime (Optional)

For future real-time trading notifications:

1. Go to "Database" → "Replication"
2. Enable replication for `trades` table
3. Click "Save"

## Part 2: Prepare Code for Deployment

### 2.1 Update Environment Variables

Create `.env.local` (already in `.gitignore`):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-key
```

### 2.2 Test Locally

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` and test:
- [ ] Landing page loads
- [ ] Can sign up with email/password
- [ ] Can create trainer and choose starter
- [ ] Game dashboard loads
- [ ] Can enter battle
- [ ] Battle works (attack, run)
- [ ] Can access trade page

### 2.3 Push to Git

```bash
git init
git add .
git commit -m "Initial commit - Pokemon Quest game"
git branch -M main
git remote add origin YOUR_REPO_URL
git push -u origin main
```

⚠️ Verify `.env.local` is **NOT** pushed (should be in `.gitignore`)

## Part 3: Deploy to Vercel

### Option A: Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Import your Git repository
4. Vercel auto-detects Next.js
5. **Add Environment Variables**:
   - Click "Environment Variables"
   - Add `NEXT_PUBLIC_SUPABASE_URL` = your URL
   - Add `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your key
   - Set for "Production, Preview, Development"
6. Click "Deploy"
7. Wait 2-3 minutes
8. Visit your live URL!

### Option B: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Follow prompts:
# ? Set up and deploy? Y
# ? Which scope? (your account)
# ? Link to existing project? N
# ? What's your project's name? pokemon-quest
# ? In which directory is your code located? ./
# ? Auto-detected Project Settings (Next.js)? Y
# ? Want to override settings? N
```

Then add environment variables:

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Paste your URL when prompted

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# Paste your key when prompted

# Redeploy with new env vars
vercel --prod
```

## Part 4: Post-Deployment Verification

### 4.1 Test Live Site

Visit your Vercel URL (e.g., `https://pokemon-quest.vercel.app`):

- [ ] Landing page loads
- [ ] Sign up works
- [ ] Trainer setup works
- [ ] Game dashboard loads with data
- [ ] Battle system functions
- [ ] Trading interface works

### 4.2 Check Supabase Logs

If issues occur:

1. Supabase Dashboard → "Logs"
2. Check for errors in:
   - **Auth Logs** (login/signup issues)
   - **Database Logs** (query errors)
   - **API Logs** (connection issues)

### 4.3 Check Vercel Logs

If issues occur:

1. Vercel Dashboard → Your Project → "Deployments"
2. Click your deployment → "View Function Logs"
3. Check for:
   - Build errors
   - Runtime errors
   - Environment variable issues

## Part 5: Custom Domain (Optional)

### 5.1 Add Domain in Vercel

1. Vercel Dashboard → Your Project → "Settings" → "Domains"
2. Enter your domain (e.g., `pokemonquest.com`)
3. Follow DNS instructions from Vercel
4. Wait for DNS propagation (5-60 minutes)

### 5.2 Update Supabase Auth (if using custom domain)

1. Supabase Dashboard → "Authentication" → "URL Configuration"
2. Add your domain to **"Site URL"**
3. Add to **"Redirect URLs"**:
   - `https://yourdomain.com/auth/callback`
   - `https://yourdomain.com/**`

## Part 6: Performance Optimization

### 6.1 Enable Vercel Analytics

1. Vercel Dashboard → Your Project → "Analytics"
2. Enable Web Analytics
3. Track page views, performance

### 6.2 Enable Supabase Connection Pooling

1. Supabase Dashboard → "Database" → "Connection Pooling"
2. Enable pooling (helps with serverless functions)

### 6.3 Set Up Monitoring

Consider:
- Vercel Speed Insights
- Sentry error tracking
- Supabase logs integration

## Troubleshooting

### Issue: "Invalid Project URL"

**Solution**: Check `NEXT_PUBLIC_SUPABASE_URL` in Vercel env vars
- Should be `https://[ref].supabase.co` (no trailing slash)
- Redeploy after fixing

### Issue: "Failed to fetch session"

**Solution**: Check `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Must be the **anon** key, not service_role key
- Re-copy from Supabase → Settings → API
- Redeploy after fixing

### Issue: "Pokemon species not found"

**Solution**: Re-run database schema
- Go to Supabase SQL Editor
- Re-run the seed data section from `DATABASE_SCHEMA.md`
- Check `pokemon_species` table has 9 rows

### Issue: "CORS error"

**Solution**: Add domain to Supabase allowed origins
1. Supabase → Settings → API → "Allowed Domains"
2. Add your Vercel domain
3. Wait 1 minute for propagation

### Issue: Middleware redirect loop

**Solution**: Check middleware.ts matcher config
- Should exclude `_next/static`, images
- Clear browser cache
- Try incognito mode

### Issue: "Database connection failed"

**Solution**: 
1. Check Supabase project is awake (opens in 1-2 seconds if paused)
2. Verify database password during setup
3. Check Supabase status page: status.supabase.com

## Scaling Considerations

### Free Tier Limits

**Supabase Free Tier:**
- 500 MB database space
- 2 GB file storage
- 50,000 monthly active users
- 2 GB bandwidth/month

**Vercel Free Tier:**
- 100 GB bandwidth/month
- Unlimited deployments
- Hobby projects

### When to Upgrade

Consider upgrading when:
- \> 100 concurrent users
- \> 10k battles/day
- \> 500 MB database size
- Need better performance

**Supabase Pro**: $25/month
- 8 GB database
- 100 GB bandwidth
- Better performance

**Vercel Pro**: $20/month
- Password-protected deployments
- Better analytics
- Priority support

## Security Checklist

Before going live:

- [ ] Environment variables are secure (not in Git)
- [ ] RLS policies enabled on all tables
- [ ] Supabase anon key used (not service_role)
- [ ] Auth confirmation emails work
- [ ] Password reset flow tested
- [ ] HTTPS enforced (Vercel does this automatically)
- [ ] No sensitive data in client-side code
- [ ] Error messages don't leak system info

## Maintenance

### Regular Tasks

**Weekly:**
- Check Vercel deployment status
- Review error logs
- Monitor Supabase usage

**Monthly:**
- Review Supabase database size
- Check for slow queries
- Update dependencies (`npm update`)

**Quarterly:**
- Update Next.js, React versions
- Review security advisories
- Backup database (Supabase does this automatically)

## Backup & Recovery

### Database Backups

Supabase automatically backs up databases:
- **Free tier**: Daily backups (7 day retention)
- **Pro tier**: Daily backups (30 day retention)

### Manual Backup

```bash
# Using pg_dump (requires PostgreSQL client)
pg_dump -h db.[your-ref].supabase.co -U postgres -d postgres > backup.sql
```

### Restore from Backup

1. Supabase Dashboard → "Database" → "Backups"
2. Select backup date
3. Click "Restore"
4. Confirm (this overwrites current data!)

## Need Help?

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Project Issues**: GitHub Issues on this repo

## Success! 🎉

Your Pokemon Quest game is now live! Share the URL with friends and start battling!

Next steps:
- Invite friends to play
- Monitor usage
- Consider adding features from the roadmap
- Join the community!

Happy training! 🎮✨
