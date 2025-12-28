# Vercel Deployment Quick Start

## Issue: Environment Variable Secrets Error

If you see this error:
```
Error: Environment Variable "VITE_SUPABASE_URL" references Secret "vite_supabase_url", which does not exist.
```

**Solution**: Add environment variables via Vercel dashboard first, then deploy.

## 🚀 Correct Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended for First Deploy)

1. **Go to Vercel Dashboard**
   - Visit [vercel.com/new](https://vercel.com/new)
   - Click "Add New" → "Project"

2. **Import Your Repository**
   - If using Git: Connect your GitHub/GitLab/Bitbucket
   - If not using Git: Use "Import from Git" and follow prompts
   - Or use Vercel CLI to link: `vercel link`

3. **Configure Project**
   - Framework Preset: **Vite** (should auto-detect)
   - Root Directory: `./` (leave as default)
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `dist` (auto-detected)
   - Install Command: `npm install --legacy-peer-deps`

4. **Add Environment Variables** (CRITICAL STEP)
   
   Go to "Environment Variables" section and add:

   | Name | Value | Environments |
   |------|-------|--------------|
   | `VITE_SUPABASE_URL` | `https://tngvatrvsoafszxyaxzu.supabase.co` | Production, Preview, Development |
   | `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key | Production, Preview, Development |
   | `DATABASE_URL` | Your Neon connection string | Production, Preview, Development |
   | `R2_ACCOUNT_ID` | Your R2 account ID | Production, Preview, Development |
   | `R2_ACCESS_KEY_ID` | Your R2 access key | Production, Preview, Development |
   | `R2_SECRET_ACCESS_KEY` | Your R2 secret key | Production, Preview, Development |
   | `R2_BUCKET_NAME` | `seido-karate-files` | Production, Preview, Development |
   | `R2_PUBLIC_URL` | Your R2 public URL | Production, Preview, Development |

   **Important**: Check all three environment checkboxes (Production, Preview, Development) for each variable!

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Visit your deployment URL

### Option 2: Deploy via Vercel CLI (After Setting Up Dashboard)

1. **Link Your Project** (first time only)
   ```bash
   vercel link
   ```
   
   Follow prompts:
   - Set up and deploy? **Y**
   - Which scope? Select your account
   - Link to existing project? **N** (if first time) or **Y** (if already created)
   - What's your project's name? `seido-karate-club`
   - In which directory is your code located? `./`

2. **Add Environment Variables via CLI** (alternative to dashboard)
   ```bash
   # Add each variable for production
   vercel env add VITE_SUPABASE_URL production
   # Paste value when prompted
   
   vercel env add VITE_SUPABASE_ANON_KEY production
   # Paste value when prompted
   
   vercel env add DATABASE_URL production
   # Paste value when prompted
   
   # ... repeat for all variables
   ```

3. **Deploy to Preview**
   ```bash
   vercel
   ```

4. **Deploy to Production**
   ```bash
   vercel --prod
   ```

## 🔧 Current Status Fix

Since you already ran `vercel`, here's what to do:

### Quick Fix Steps:

1. **Go to Vercel Dashboard**
   - Visit [vercel.com/dashboard](https://vercel.com/dashboard)
   - Find your `seido-karate-club` project (it may have been created)

2. **Add Environment Variables**
   - Click on the project
   - Go to "Settings" → "Environment Variables"
   - Add all the variables listed above

3. **Redeploy**
   ```bash
   vercel --prod
   ```

## 📋 Environment Variables Checklist

Make sure you have these values ready:

- [ ] `VITE_SUPABASE_URL` - From your Supabase project settings
- [ ] `VITE_SUPABASE_ANON_KEY` - From Supabase project settings
- [ ] `DATABASE_URL` - From Neon project dashboard
- [ ] `R2_ACCOUNT_ID` - From Cloudflare R2 dashboard
- [ ] `R2_ACCESS_KEY_ID` - From R2 API token creation
- [ ] `R2_SECRET_ACCESS_KEY` - From R2 API token creation
- [ ] `R2_BUCKET_NAME` - Your bucket name (e.g., `seido-karate-files`)
- [ ] `R2_PUBLIC_URL` - Your R2 bucket public URL

## 🎯 If You Haven't Set Up Neon/R2 Yet

If you haven't set up Neon or Cloudflare R2 yet, you can still deploy with just Supabase for now:

1. **Deploy with Supabase Only** (temporary)
   - Only add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
   - Deploy to test the app
   - Add Neon/R2 variables later when ready

2. **Add Database/Storage Later**
   - Set up Neon database
   - Set up Cloudflare R2
   - Add environment variables in Vercel
   - Redeploy

## 🆘 Troubleshooting

### "Project not found" error
```bash
# Remove .vercel directory and re-link
rm -rf .vercel
vercel link
```

### "Build failed" error
- Check build logs in Vercel dashboard
- Verify all environment variables are set
- Ensure `npm install --legacy-peer-deps` is used

### "Environment variable not found" in app
- Make sure variables start with `VITE_` for client-side access
- Redeploy after adding variables
- Check variable names match exactly (case-sensitive)

## ✅ Verification

After deployment:

1. Visit your Vercel URL
2. Check browser console for errors
3. Try logging in
4. Verify database connection works

## 📞 Need Help?

- Vercel Docs: [vercel.com/docs](https://vercel.com/docs)
- Vercel Discord: [vercel.com/discord](https://vercel.com/discord)

---

**Next Step**: Add environment variables in Vercel dashboard, then run `vercel --prod` again!
