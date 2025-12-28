# Seido Karate Club - Deployment Checklist

Use this checklist to track your migration progress from Loveable/Supabase to Vercel/Neon.

## ✅ Pre-Deployment Setup

### Neon Database Setup
- [ ] Created Neon account at [console.neon.tech](https://console.neon.tech)
- [ ] Created new project named "seido-karate-club"
- [ ] Copied connection string
- [ ] Saved connection string securely

### Cloudflare R2 Setup
- [ ] Created Cloudflare account
- [ ] Created R2 bucket named "seido-karate-files"
- [ ] Configured CORS policy for bucket
- [ ] Created API token with Read & Write permissions
- [ ] Saved Account ID, Access Key ID, and Secret Access Key

### Vercel Setup
- [ ] Created Vercel account at [vercel.com](https://vercel.com)
- [ ] Connected GitHub account (if using Git deployment)
- [ ] Familiarized with Vercel dashboard

## 📊 Database Migration

### Run Migrations
- [ ] Connected to Neon database using psql or SQL Editor
- [ ] Executed all migration files from `supabase/migrations/` in order
- [ ] Verified all tables created successfully
- [ ] Checked RLS policies are in place

### Data Export from Supabase
- [ ] Exported `profiles` table data
- [ ] Exported `ranks` table data
- [ ] Exported `gradings` table data
- [ ] Exported `grading_history` table data
- [ ] Exported `grading_periods` table data
- [ ] Exported `referee_question_banks` table data
- [ ] Exported `referee_questions` table data
- [ ] Exported `referee_rule_documents` table data
- [ ] Exported `referee_progress` table data
- [ ] Exported `referee_quiz_attempts` table data

### Data Import to Neon
- [ ] Imported all data to Neon database
- [ ] Verified row counts match Supabase
- [ ] Tested sample queries
- [ ] Verified foreign key relationships intact

## 📁 File Migration

### Export from Supabase Storage
- [ ] Downloaded all files from `profile-pictures` bucket
- [ ] Downloaded all files from `certificates` bucket
- [ ] Downloaded all files from `signatures` bucket
- [ ] Downloaded all files from `indemnities` bucket
- [ ] Organized files in local folders

### Upload to Cloudflare R2
- [ ] Configured AWS CLI for R2
- [ ] Uploaded `profile-pictures` to R2
- [ ] Uploaded `certificates` to R2
- [ ] Uploaded `signatures` to R2
- [ ] Uploaded `indemnities` to R2
- [ ] Verified file counts match
- [ ] Tested file access via public URL

## ⚙️ Local Configuration

### Environment Setup
- [ ] Copied `.env.example` to `.env`
- [ ] Added Neon `DATABASE_URL`
- [ ] Added Supabase `VITE_SUPABASE_URL`
- [ ] Added Supabase `VITE_SUPABASE_ANON_KEY`
- [ ] Added R2 `R2_ACCOUNT_ID`
- [ ] Added R2 `R2_ACCESS_KEY_ID`
- [ ] Added R2 `R2_SECRET_ACCESS_KEY`
- [ ] Added R2 `R2_BUCKET_NAME`
- [ ] Added R2 `R2_PUBLIC_URL`

### Dependencies
- [ ] Ran `npm install --legacy-peer-deps`
- [ ] Verified no critical errors
- [ ] Checked all packages installed

## 🧪 Local Testing

### Start Development Server
- [ ] Ran `npm run dev`
- [ ] Application started without errors
- [ ] Opened http://localhost:8080 in browser

### Test Authentication
- [ ] Logged in with existing account
- [ ] Verified profile loads correctly
- [ ] Tested logout functionality
- [ ] Tested password reset (optional)

### Test Student Features
- [ ] Viewed student profile
- [ ] Viewed grading history
- [ ] Applied for grading (if period open)
- [ ] Took referee quiz
- [ ] Checked progress tracking

### Test Instructor Features
- [ ] Viewed all members list
- [ ] Created new grading period
- [ ] Reviewed grading applications
- [ ] Entered grading results with remarks
- [ ] Uploaded certificate

### Test Admin Features
- [ ] Modified user role
- [ ] Changed member rank
- [ ] Updated historical data
- [ ] Viewed audit logs

### Test File Operations
- [ ] Uploaded profile picture
- [ ] Verified picture displays correctly
- [ ] Downloaded certificate
- [ ] Verified file URLs work

## 🚀 Vercel Deployment

### Initial Setup
- [ ] Logged into Vercel
- [ ] Created new project or connected Git repository
- [ ] Configured build settings (auto-detected for Vite)

### Environment Variables
- [ ] Added `DATABASE_URL` in Vercel project settings
- [ ] Added `VITE_SUPABASE_URL`
- [ ] Added `VITE_SUPABASE_ANON_KEY`
- [ ] Added `R2_ACCOUNT_ID`
- [ ] Added `R2_ACCESS_KEY_ID`
- [ ] Added `R2_SECRET_ACCESS_KEY`
- [ ] Added `R2_BUCKET_NAME`
- [ ] Added `R2_PUBLIC_URL`
- [ ] Set environment variables for all environments (Production, Preview, Development)

### Deploy
- [ ] Triggered initial deployment
- [ ] Waited for build to complete
- [ ] Checked build logs for errors
- [ ] Verified deployment successful

## ✅ Production Testing

### Access Production Site
- [ ] Opened Vercel deployment URL
- [ ] Verified site loads correctly
- [ ] Checked for console errors

### Test Core Functionality
- [ ] Logged in with test account
- [ ] Verified database queries work
- [ ] Tested file upload
- [ ] Tested file download
- [ ] Verified all pages load

### Performance Check
- [ ] Tested page load speed
- [ ] Verified images load correctly
- [ ] Checked mobile responsiveness
- [ ] Tested on different browsers

## 🔒 Security & Cleanup

### Security
- [ ] Changed default admin password
- [ ] Reviewed Neon database access controls
- [ ] Verified R2 bucket permissions
- [ ] Checked Supabase auth settings
- [ ] Enabled Vercel password protection (if needed)

### Monitoring
- [ ] Set up Neon usage alerts
- [ ] Enabled Vercel deployment notifications
- [ ] Configured Cloudflare R2 usage alerts
- [ ] Bookmarked all dashboards

### Documentation
- [ ] Updated README with production URLs
- [ ] Documented any custom configurations
- [ ] Shared credentials with team (securely)
- [ ] Created backup of environment variables

## 🎯 Post-Deployment

### DNS & Domain (Optional)
- [ ] Added custom domain in Vercel
- [ ] Updated DNS records
- [ ] Verified SSL certificate
- [ ] Tested custom domain access

### Monitoring
- [ ] Checked Vercel Analytics
- [ ] Monitored Neon database performance
- [ ] Reviewed R2 storage usage
- [ ] Set up uptime monitoring (optional)

### Team Notification
- [ ] Notified all users of new URL
- [ ] Provided migration timeline
- [ ] Shared any new login instructions
- [ ] Collected feedback

## 🔄 Rollback Plan (If Needed)

### Emergency Rollback
- [ ] Keep Loveable deployment active during migration
- [ ] Don't delete Supabase project for 30 days
- [ ] Maintain backup of all data
- [ ] Document rollback procedure

### Rollback Steps (If Required)
1. [ ] Switch DNS back to Loveable URL
2. [ ] Re-enable Supabase project
3. [ ] Notify users of rollback
4. [ ] Investigate issues
5. [ ] Plan re-migration

## 📊 Success Metrics

### Technical Metrics
- [ ] Zero deployment errors
- [ ] Page load time < 2 seconds
- [ ] Database queries < 100ms
- [ ] File uploads working
- [ ] All features functional

### Cost Metrics
- [ ] Neon usage within free tier (< 0.5 GB)
- [ ] Vercel bandwidth within free tier (< 100 GB/month)
- [ ] R2 storage within free tier (< 10 GB)
- [ ] Total cost: $0/month ✅

### User Metrics
- [ ] All users can log in
- [ ] No data loss reported
- [ ] Features working as expected
- [ ] Positive user feedback

## 🎉 Migration Complete!

Once all items are checked:

- [ ] **Migration officially complete**
- [ ] **Loveable deployment can be deactivated** (after 30-day safety period)
- [ ] **Supabase project can be archived** (keep for backup)
- [ ] **Celebrate!** 🎊

---

**Notes:**

Use this space to document any issues, custom configurations, or important details:

```
[Add your notes here]
```

---

**Last Updated:** [Date]
**Completed By:** [Name]
**Production URL:** [Vercel URL]
