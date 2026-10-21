# Deploy Pokemon Quest to Vercel (Dashboard Method)

## ⚡ Quick Deploy (5 minutes)

Your repo is ready: https://github.com/blonde-mike/pokemon-quest

### Step 1: Set Up Supabase (if not done)

1. Go to https://supabase.com/dashboard/projects
2. Click "New Project"
3. Fill in:
   - Name: `pokemon-quest`
   - Database Password: (generate and save it)
   - Region: Choose closest to you
4. Click "Create new project" (wait 2-3 minutes)

### Step 2: Run Database Setup

1. In Supabase dashboard, click "SQL Editor"
2. Click "New Query"
3. Open `DATABASE_SCHEMA.md` in this repo
4. Copy **entire file** contents
5. Paste into SQL editor
6. Click "Run" (Cmd/Ctrl + Enter)
7. Should see "Success. No rows returned"

### Step 3: Get Supabase Credentials

1. Go to "Project Settings" (gear icon)
2. Click "API"
3. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: Long string starting with `eyJ...`

📋 Keep these handy for next step!

### Step 4: Deploy to Vercel

1. **Go to**: https://vercel.com/new
2. Click "Import Git Repository"
3. If not connected to GitHub:
   - Click "Continue with GitHub"
   - Authorize Vercel
4. Find `blonde-mike/pokemon-quest` in the list
5. Click "Import"

### Step 5: Configure Project

On the import screen:

1. **Project Name**: `pokemon-quest` (or your choice)
2. **Framework Preset**: Next.js (auto-detected ✓)
3. **Root Directory**: `./` (leave as is)
4. **Build Settings**: Leave defaults

### Step 6: Add Environment Variables

Still on import screen:

1. Click "Environment Variables" section
2. Add Variable 1:
   - **Key**: `NEXT_PUBLIC_SUPABASE_URL`
   - **Value**: Paste your Supabase project URL
   - **Environments**: Production, Preview, Development ✓✓✓
3. Add Variable 2:
   - **Key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Value**: Paste your Supabase anon key
   - **Environments**: Production, Preview, Development ✓✓✓
4. Click "Deploy"

### Step 7: Wait for Build

- Takes 2-3 minutes
- Watch build logs (shows npm install, Next.js build)
- When done: "🎉 Congratulations!"

### Step 8: Visit Your Live Site

1. Click the screenshot preview
2. Or click your domain: `pokemon-quest-xxxxx.vercel.app`
3. You'll see the landing page!

### Step 9: Test the Game

1. Click "START ADVENTURE"
2. Sign up with email/password
3. Choose trainer name
4. Pick a starter Pokemon
5. Try a battle!

## 🎮 Your Live URLs

- **Production**: https://pokemon-quest-opo7sxgpc-raven-stack.vercel.app (Vercel team `raven-stack`)
- **GitHub**: https://github.com/blonde-mike/pokemon-quest
- **Supabase**: `https://xxxxx.supabase.co`

Note: `pokemon-quest.vercel.app` (no team suffix) belongs to a different project. Do not use it.

### Make it playable (one-time, dashboard only)

1. **Supabase, SQL Editor**: run `supabase/migrations/0001_seed_policies_rpc.sql`. Without it the lab is empty and starter selection fails.
2. **Supabase, Authentication, Providers, Email**: turn off "Confirm email". Otherwise add `https://<your-domain>/auth/callback` under URL Configuration, Redirect URLs.
3. **Vercel, Settings, Deployment Protection**: set Vercel Authentication to "Only Preview Deployments". Right now production redirects visitors to a Vercel SSO login.

## 🔧 Troubleshooting

### "Invalid Supabase URL"

**Fix**: Check env vars in Vercel
1. Go to your project → Settings → Environment Variables
2. Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
3. Should be `https://[ref].supabase.co` (no trailing slash)
4. Click "Redeploy" from Deployments tab

### "Failed to fetch session"

**Fix**: Check anon key
1. Must be **anon** key, not service_role key
2. Re-copy from Supabase → Settings → API
3. Update in Vercel env vars
4. Redeploy

### "Pokemon species not found"

**Fix**: Re-run database schema
1. Supabase → SQL Editor
2. Re-paste `DATABASE_SCHEMA.md` contents
3. Run it again
4. Refresh your app

### Build fails

**Fix**: Check build logs
1. Vercel dashboard → Deployments
2. Click failed deployment
3. Check "Build Logs" for errors
4. Usually missing env vars or TypeScript errors

## 🚀 Post-Deployment

### Add Custom Domain (Optional)

1. Vercel → Project → Settings → Domains
2. Enter your domain
3. Follow DNS instructions
4. Wait 5-60 min for propagation

### Enable Analytics

1. Vercel → Project → Analytics
2. Turn on "Web Analytics"
3. Free tier: 100k events/month

### Monitor Performance

1. Check Supabase dashboard → Logs
2. Check Vercel dashboard → Deployments
3. Set up error tracking (optional: Sentry)

## 🎯 Next Steps

- **Share with friends**: Send them your Vercel URL
- **Customize**: Update Pokemon species, add more features
- **Scale**: Upgrade Supabase/Vercel if needed

## 📚 Full Documentation

- [README.md](./README.md) - Game features
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Detailed deploy guide
- [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) - Technical overview
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - SQL schema

## ✅ Success Checklist

- [ ] Supabase project created
- [ ] Database schema executed
- [ ] Vercel project created
- [ ] Environment variables added
- [ ] Deployment successful
- [ ] Landing page loads
- [ ] Can sign up
- [ ] Can choose starter
- [ ] Can battle
- [ ] Can trade

## 🆘 Need Help?

- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- GitHub Issues: https://github.com/blonde-mike/pokemon-quest/issues

---

**You're all set! 🎮 Go catch 'em all!**
