# GitHub + Vercel Integration Setup

## ✅ Current Status

Your repository is already set up!

- **Git Repository**: Initialized ✅
- **GitHub Remote**: https://github.com/nictan/seido.git ✅
- **Current Branch**: `main` ✅
- **Vercel Project**: Connected ✅

## 🔄 Uncommitted Changes

You have new files that need to be committed:

```
Modified:
- vercel.json (updated for deployment)

New Files:
- DEPLOYMENT_STATUS.md
- NEON_SETUP.md
- VERCEL_SETUP.md
- migrate-database.sh
```

## 🚀 Quick Setup Steps

### Step 1: Commit Recent Changes

```bash
# Add all new files
git add .

# Commit with descriptive message
git commit -m "feat: add Vercel and Neon deployment configuration

- Add deployment status tracking
- Add Neon database setup guide
- Add Vercel deployment guide
- Add automated database migration script
- Update vercel.json for proper deployment"

# Push to GitHub
git push seido main
```

### Step 2: Connect Vercel to GitHub Repository

1. **Go to Vercel Project Settings**
   - Visit: https://vercel.com/nicorasutangmailcoms-projects/seido/settings

2. **Navigate to Git Section**
   - Click "Git" in the left sidebar

3. **Connect Repository**
   - If not already connected, click "Connect Git Repository"
   - Select "GitHub"
   - Choose repository: `nictan/seido`
   - Click "Connect"

4. **Configure Deployment Settings**
   - **Production Branch**: `main`
   - **Automatic Deployments**: Enabled (should be default)
   - **Deploy Hooks**: Optional

### Step 3: Verify Automatic Deployments

After pushing your changes:

1. **Check Vercel Dashboard**
   - Go to https://vercel.com/nicorasutangmailcoms-projects/seido
   - You should see a new deployment triggered automatically

2. **View Deployment**
   - Click on the deployment to see build logs
   - Verify it completes successfully

## 🌿 Branch Strategy

### Recommended Setup

```
main (production)
  └── development (staging/preview)
       └── feature/* (feature branches)
```

### Create Development Branch

```bash
# Create development branch
git checkout -b development

# Push to GitHub
git push seido development

# Go back to main
git checkout main
```

### Configure in Vercel

1. Go to Project Settings → Git
2. Set **Production Branch**: `main`
3. **Preview Deployments**: All branches (default)

## 🔄 Automatic Deployment Workflow

### How It Works

**Push to `main` branch**:
- ✅ Triggers production deployment
- ✅ Deploys to: https://seido-eight.vercel.app
- ✅ Uses production environment variables

**Push to any other branch**:
- ✅ Triggers preview deployment
- ✅ Deploys to: Unique preview URL
- ✅ Uses preview environment variables

**Create Pull Request**:
- ✅ Vercel comments on PR with preview URL
- ✅ Updates preview on every commit
- ✅ Perfect for code review

## 📋 Daily Development Workflow

### Starting New Feature

```bash
# Make sure you're on development branch
git checkout development
git pull seido development

# Create feature branch
git checkout -b feature/new-grading-system

# Make your changes
# ... edit files ...

# Commit changes
git add .
git commit -m "feat: add new grading system feature"

# Push to GitHub (triggers preview deployment)
git push seido feature/new-grading-system
```

### Creating Pull Request

1. Go to https://github.com/nictan/seido
2. Click "Pull requests" → "New pull request"
3. Base: `development` ← Compare: `feature/new-grading-system`
4. Create pull request
5. Vercel will automatically comment with preview URL
6. Review and test the preview deployment
7. Merge when ready

### Deploying to Production

```bash
# Merge development to main
git checkout main
git pull seido main
git merge development

# Push to trigger production deployment
git push seido main
```

## 🔐 Environment Variables in Vercel

### Current Setup

Go to https://vercel.com/nicorasutangmailcoms-projects/seido/settings/environment-variables

**Required Variables**:

| Variable | Value | Environments |
|----------|-------|--------------|
| `VITE_SUPABASE_URL` | Your Supabase URL | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase key | Production, Preview, Development |
| `DATABASE_URL` | Neon connection string | Production, Preview |

**Production DATABASE_URL**:
```
postgresql://neondb_owner:npg_nAC5hlKqTN9b@ep-shy-recipe-af4o35w7-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require
```

**Preview DATABASE_URL** (optional, can use same as production or separate):
```
postgresql://neondb_owner:npg_nAC5hlKqTN9b@ep-broad-sky-afaozh9y-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require
```

### Adding Environment Variables

1. Go to Settings → Environment Variables
2. Click "Add New"
3. Enter name and value
4. Select environments (Production, Preview, Development)
5. Click "Save"
6. Redeploy for changes to take effect

## 🎯 Vercel Deployment Settings

### Build Configuration

Already configured in `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "installCommand": "npm install --legacy-peer-deps",
  "devCommand": "npm run dev"
}
```

### Custom Domain (Optional)

1. Go to Settings → Domains
2. Click "Add"
3. Enter your domain name
4. Follow DNS configuration instructions
5. Wait for SSL certificate provisioning

## 📊 Monitoring Deployments

### Vercel Dashboard

- **Deployments**: https://vercel.com/nicorasutangmailcoms-projects/seido
- **Analytics**: View traffic and performance
- **Logs**: Real-time deployment and runtime logs

### GitHub Integration

- **Commit Status**: Green checkmark when deployment succeeds
- **PR Comments**: Automatic preview URLs
- **Deployment History**: Track all deployments

## 🔄 Rollback

If a deployment has issues:

1. Go to Vercel Dashboard → Deployments
2. Find the last working deployment
3. Click "..." → "Promote to Production"
4. Or revert the Git commit and push

## 🆘 Troubleshooting

### Deployment Fails

1. **Check Build Logs**:
   - Go to Vercel Dashboard
   - Click on failed deployment
   - Review build logs for errors

2. **Common Issues**:
   - Missing environment variables
   - Build command errors
   - Dependency issues

3. **Fix**:
   - Update environment variables
   - Fix code issues
   - Push again to trigger new deployment

### Preview Deployment Not Created

1. **Check Vercel Settings**:
   - Ensure "Automatic Deployments" is enabled
   - Verify branch is not ignored

2. **Check GitHub Connection**:
   - Settings → Git
   - Reconnect if needed

### Environment Variables Not Working

1. **Redeploy After Adding**:
   ```bash
   vercel --prod
   ```

2. **Check Variable Names**:
   - Must start with `VITE_` for client-side access
   - Case-sensitive

## ✅ Verification Checklist

- [ ] Git repository initialized
- [ ] Connected to GitHub: https://github.com/nictan/seido
- [ ] Vercel connected to GitHub repository
- [ ] Production branch set to `main`
- [ ] Environment variables added to Vercel
- [ ] Test deployment successful
- [ ] Preview deployments working
- [ ] Development branch created (optional)

## 🎉 You're All Set!

Your GitHub + Vercel integration is ready! Here's what happens now:

1. **Push to `main`** → Automatic production deployment
2. **Push to other branches** → Automatic preview deployments
3. **Create PR** → Vercel comments with preview URL
4. **Merge PR** → Automatic deployment

## 📚 Next Steps

1. Commit and push your recent changes
2. Verify automatic deployment works
3. Create development branch (optional)
4. Set up branch protection rules (optional)
5. Add team members to repository (if applicable)

---

**Quick Command Reference**:

```bash
# Commit recent changes
git add .
git commit -m "feat: add deployment documentation"
git push seido main

# Create development branch
git checkout -b development
git push seido development

# Check deployment status
vercel ls

# View logs
vercel logs
```

**Useful Links**:
- GitHub Repo: https://github.com/nictan/seido
- Vercel Project: https://vercel.com/nicorasutangmailcoms-projects/seido
- Production URL: https://seido-eight.vercel.app
