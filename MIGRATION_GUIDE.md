# Seido Karate Club - Migration Guide

This guide walks you through migrating the application from Loveable/Supabase to Vercel + Neon.

## 📋 Pre-Migration Checklist

- [ ] Neon account created
- [ ] Cloudflare account created (for R2 storage)
- [ ] Vercel account created
- [ ] Backup of current Supabase data exported
- [ ] All team members notified of migration

## 🗄️ Step 1: Set Up Neon Database

### 1.1 Create Neon Project

1. Go to [console.neon.tech](https://console.neon.tech)
2. Click "Create a project"
3. Choose a name: "seido-karate-club"
4. Select region closest to your users
5. Click "Create project"

### 1.2 Get Connection String

1. In your Neon project dashboard, click "Connection Details"
2. Copy the connection string (it looks like):
   ```
   postgresql://[user]:[password]@[host]/[database]?sslmode=require
   ```
3. Save this for later - you'll need it in `.env`

### 1.3 Run Database Migrations

You need to execute all SQL migration files from the `supabase/migrations/` directory in order.

**Option A: Using psql (Recommended)**

```bash
# Connect to Neon database
psql "your-neon-connection-string-here"

# Then run each migration file in order by timestamp
\i supabase/migrations/20250926223011_4f40b56d-7391-4c39-8c42-a826c2d52217.sql
\i supabase/migrations/20250926230529_c3ac45bb-f484-41a1-86f1-de9c3cf1f8fd.sql
# ... continue with all migration files in order
```

**Option B: Using Neon SQL Editor**

1. Go to your Neon project dashboard
2. Click "SQL Editor"
3. Copy and paste each migration file content in order
4. Execute each one

**Migration Files Order:**

```bash
ls -1 supabase/migrations/ | sort
```

Execute them in the order shown (by timestamp).

### 1.4 Verify Database Schema

After running migrations, verify tables were created:

```sql
-- List all tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Should see:
-- profiles
-- ranks
-- gradings
-- grading_history
-- grading_periods
-- referee_question_banks
-- referee_questions
-- referee_rule_documents
-- referee_progress
-- referee_quiz_attempts
```

## 📦 Step 2: Set Up Cloudflare R2 Storage

### 2.1 Create R2 Bucket

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to R2 Object Storage
3. Click "Create bucket"
4. Name it: `seido-karate-files`
5. Click "Create bucket"

### 2.2 Configure CORS

1. Click on your bucket
2. Go to "Settings" → "CORS policy"
3. Add this CORS configuration:

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

### 2.3 Create API Token

1. Go to "Manage R2 API Tokens"
2. Click "Create API token"
3. Name: "seido-karate-app"
4. Permissions: "Object Read & Write"
5. Click "Create API Token"
6. **Save these values** (you won't see them again):
   - Access Key ID
   - Secret Access Key
   - Account ID (shown in R2 dashboard)

### 2.4 Get Public URL

Your R2 bucket URL will be:
```
https://[bucket-name].[account-id].r2.cloudflarestorage.com
```

Or set up a custom domain for better URLs.

## 🔄 Step 3: Migrate Data from Supabase to Neon

### 3.1 Export Data from Supabase

**Option A: Using Supabase Dashboard**

1. Go to your Supabase project
2. Navigate to "Table Editor"
3. For each table, click "..." → "Export as CSV"
4. Save all CSV files

**Option B: Using pg_dump**

```bash
# Get your Supabase connection string from project settings
pg_dump "your-supabase-connection-string" \
  --data-only \
  --table=profiles \
  --table=ranks \
  --table=gradings \
  --table=grading_history \
  --table=grading_periods \
  --table=referee_question_banks \
  --table=referee_questions \
  --table=referee_rule_documents \
  --table=referee_progress \
  --table=referee_quiz_attempts \
  > supabase_data.sql
```

### 3.2 Import Data to Neon

```bash
# Connect to Neon and import
psql "your-neon-connection-string" < supabase_data.sql
```

### 3.3 Verify Data Migration

```sql
-- Check row counts match
SELECT 'profiles' as table_name, COUNT(*) FROM profiles
UNION ALL
SELECT 'gradings', COUNT(*) FROM gradings
UNION ALL
SELECT 'grading_history', COUNT(*) FROM grading_history;
-- etc.
```

## 📁 Step 4: Migrate Files to Cloudflare R2

### 4.1 Export Files from Supabase Storage

Use the Supabase Storage API or dashboard to download all files from:
- `profile-pictures` bucket
- `certificates` bucket
- `signatures` bucket
- `indemnities` bucket

### 4.2 Upload to R2

You can use the AWS CLI (R2 is S3-compatible):

```bash
# Configure AWS CLI for R2
aws configure --profile r2
# Enter your R2 Access Key ID and Secret Access Key
# Region: auto
# Output format: json

# Upload files
aws s3 sync ./profile-pictures s3://seido-karate-files/profile-pictures --profile r2 --endpoint-url https://[account-id].r2.cloudflarestorage.com
aws s3 sync ./certificates s3://seido-karate-files/certificates --profile r2 --endpoint-url https://[account-id].r2.cloudflarestorage.com
# etc.
```

## ⚙️ Step 5: Configure Environment Variables

### 5.1 Create Local .env File

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

### 5.2 Fill in Values

Edit `.env` with your actual credentials:

```env
# Neon Database
DATABASE_URL=postgresql://[user]:[password]@[host]/[database]?sslmode=require

# Supabase Auth (keeping for authentication only)
VITE_SUPABASE_URL=https://tngvatrvsoafszxyaxzu.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Cloudflare R2
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_BUCKET_NAME=seido-karate-files
R2_PUBLIC_URL=https://seido-karate-files.[account-id].r2.cloudflarestorage.com
```

## 🧪 Step 6: Test Locally

### 6.1 Start Development Server

```bash
npm run dev
```

### 6.2 Test All Features

- [ ] Login with existing account
- [ ] View member profiles
- [ ] Create a grading period (as instructor)
- [ ] Apply for grading (as student)
- [ ] Enter grading results (as instructor)
- [ ] Upload profile picture
- [ ] Download certificate
- [ ] Take referee quiz
- [ ] Admin functions

### 6.3 Check Database Connections

Open browser console and verify no database connection errors.

## 🚀 Step 7: Deploy to Vercel

### 7.1 Install Vercel CLI (Optional)

```bash
npm i -g vercel
```

### 7.2 Deploy

**Option A: Using Vercel CLI**

```bash
# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts to link project
```

**Option B: Using Vercel Dashboard**

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Import your Git repository
4. Vercel will auto-detect Vite configuration
5. Click "Deploy"

### 7.3 Configure Environment Variables in Vercel

1. Go to your project in Vercel dashboard
2. Navigate to "Settings" → "Environment Variables"
3. Add all variables from your `.env` file:

```
DATABASE_URL
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME
R2_PUBLIC_URL
```

4. Make sure to add them for all environments (Production, Preview, Development)

### 7.4 Redeploy

After adding environment variables:

```bash
vercel --prod
```

Or trigger a new deployment from the Vercel dashboard.

## ✅ Step 8: Post-Migration Verification

### 8.1 Test Production Deployment

Visit your Vercel URL and test:

- [ ] Authentication works
- [ ] All pages load correctly
- [ ] Database queries work
- [ ] File uploads work
- [ ] File downloads work
- [ ] All user roles function correctly

### 8.2 Monitor Performance

1. Check Vercel Analytics for any errors
2. Monitor Neon database usage
3. Check R2 storage metrics

### 8.3 Update DNS (if using custom domain)

1. In Vercel, go to "Settings" → "Domains"
2. Add your custom domain
3. Update DNS records as instructed by Vercel

## 🔒 Step 9: Security Checklist

- [ ] Change default admin password
- [ ] Review RLS policies in Neon
- [ ] Verify R2 bucket permissions
- [ ] Enable Vercel password protection (if needed)
- [ ] Set up monitoring and alerts
- [ ] Review Supabase auth settings

## 📊 Step 10: Monitor Costs

### Free Tier Limits

**Neon:**
- 0.5 GB storage
- Unlimited compute (with autosuspend)
- Monitor in Neon dashboard

**Vercel:**
- 100 GB bandwidth/month
- Unlimited deployments
- Monitor in Vercel dashboard

**Cloudflare R2:**
- 10 GB storage
- 1M Class A operations/month
- Monitor in Cloudflare dashboard

### Set Up Alerts

1. **Neon**: Set up email alerts for storage usage
2. **Vercel**: Enable email notifications for deployment failures
3. **Cloudflare**: Set up usage alerts in R2 dashboard

## 🆘 Troubleshooting

### Database Connection Issues

**Problem**: "Connection timeout" or "SSL required"

**Solution**:
- Ensure connection string includes `?sslmode=require`
- Check Neon database is not suspended (wake it up by connecting)
- Verify IP allowlist in Neon settings

### File Upload Failures

**Problem**: CORS errors when uploading files

**Solution**:
- Verify R2 CORS configuration
- Check R2 API token permissions
- Ensure bucket is publicly accessible for profile pictures

### Authentication Issues

**Problem**: Users can't log in

**Solution**:
- Verify Supabase URL and Anon Key are correct
- Check Supabase project is still active
- Ensure auth.users table still exists in Supabase

### Build Failures on Vercel

**Problem**: Build fails with dependency errors

**Solution**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

## 🔄 Rollback Plan

If you need to rollback to Loveable/Supabase:

1. Keep Loveable deployment active during migration
2. Don't delete Supabase project until migration is verified
3. DNS can be switched back to Loveable URL
4. Data can be re-exported from Neon back to Supabase if needed

## 📞 Support

For issues during migration:
- Check Neon documentation: [neon.tech/docs](https://neon.tech/docs)
- Cloudflare R2 docs: [developers.cloudflare.com/r2](https://developers.cloudflare.com/r2)
- Vercel docs: [vercel.com/docs](https://vercel.com/docs)

---

**Migration Complete! 🎉**

Your Seido Karate Club application is now running on Vercel with Neon database and Cloudflare R2 storage, all on free tiers!
