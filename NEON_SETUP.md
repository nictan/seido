# Neon Database Setup Guide

## 🎉 Great News!

Your Vercel deployment is live at:
- **Production**: https://seido-eight.vercel.app
- **Inspect**: https://vercel.com/nicorasutangmailcoms-projects/seido

## 📊 Your Neon Database Branches

You have two Neon database branches set up:

### Development Branch (for local development)
```
postgresql://neondb_owner:npg_nAC5hlKqTN9b@ep-broad-sky-afaozh9y-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require
```

### Production Branch (for Vercel deployment)
```
postgresql://neondb_owner:npg_nAC5hlKqTN9b@ep-shy-recipe-af4o35w7-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require
```

## 🔧 Setup Steps

### Step 1: Update Local .env File

Edit your `.env` file and update the `DATABASE_URL`:

```bash
# Open .env in your editor
code .env  # or nano .env, or vim .env
```

Replace the DATABASE_URL line with your **Development branch**:

```env
DATABASE_URL=postgresql://neondb_owner:npg_nAC5hlKqTN9b@ep-broad-sky-afaozh9y-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require
```

### Step 2: Run Database Migrations on Development Branch

Connect to your **Development** Neon database and run migrations:

```bash
# Connect to Development database
psql "postgresql://neondb_owner:npg_nAC5hlKqTN9b@ep-broad-sky-afaozh9y-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require"
```

Then run each migration file in order:

```sql
-- List all migration files to run
\! ls -1 supabase/migrations/ | sort

-- Run each migration (example for first one)
\i supabase/migrations/20250926223011_4f40b56d-7391-4c39-8c42-a826c2d52217.sql
\i supabase/migrations/20250926230529_c3ac45bb-f484-41a1-86f1-de9c3cf1f8fd.sql
-- ... continue with all files in order
```

Or run them all at once:

```bash
# From your project directory
for file in supabase/migrations/*.sql; do
  echo "Running $file..."
  psql "postgresql://neondb_owner:npg_nAC5hlKqTN9b@ep-broad-sky-afaozh9y-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require" -f "$file"
done
```

### Step 3: Run Database Migrations on Production Branch

Repeat the same process for your **Production** database:

```bash
# Connect to Production database
psql "postgresql://neondb_owner:npg_nAC5hlKqTN9b@ep-shy-recipe-af4o35w7-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require"
```

Run all migrations:

```bash
for file in supabase/migrations/*.sql; do
  echo "Running $file..."
  psql "postgresql://neondb_owner:npg_nAC5hlKqTN9b@ep-shy-recipe-af4o35w7-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require" -f "$file"
done
```

### Step 4: Add Production DATABASE_URL to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/nicorasutangmailcoms-projects/seido)
2. Click "Settings" → "Environment Variables"
3. Add a new variable:
   - **Name**: `DATABASE_URL`
   - **Value**: `postgresql://neondb_owner:npg_nAC5hlKqTN9b@ep-shy-recipe-af4o35w7-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require`
   - **Environments**: Check "Production" and "Preview"
4. Click "Save"

### Step 5: Redeploy to Vercel

After adding the DATABASE_URL:

```bash
vercel --prod
```

## ✅ Verification

### Test Local Development

1. Make sure your `.env` has the Development DATABASE_URL
2. Restart your dev server:
   ```bash
   npm run dev
   ```
3. Visit http://localhost:8080
4. Try logging in with the default admin account:
   - Email: `contact@hayashiha.sg`
   - Password: `Password`

### Test Production Deployment

1. Visit https://seido-eight.vercel.app
2. Try logging in
3. Check browser console for any database errors

## 🔍 Verify Database Schema

Check that all tables were created:

```sql
-- Connect to database
psql "your-connection-string"

-- List all tables
\dt

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

## 📋 Migration Files Order

Run these in order (by timestamp):

1. `20250926223011_4f40b56d-7391-4c39-8c42-a826c2d52217.sql` - Initial schema
2. `20250926230529_c3ac45bb-f484-41a1-86f1-de9c3cf1f8fd.sql`
3. `20250926230550_cf554aa1-00e1-4868-9f6d-0dfb0712f687.sql`
4. `20250927023248_2d6d104f-072e-4a14-8703-7af21bd21f2a.sql`
5. `20250927033341_25f0a135-1cee-49f8-b5f1-d1909c95e254.sql`
6. `20250927033542_524cce02-9b64-4ca2-affd-b676bff55123.sql`
7. `20250927034255_0e94d2e0-6061-4e31-aaee-597756bf9ba4.sql`
8. `20250927034947_f3f88b0f-f98f-485f-990f-bb0a069e9ae0.sql`
9. `20250927114053_771a7317-a1cf-4383-b374-389c84ba4209.sql`
10. `20250928234457_038631e4-bc48-47d5-8507-b4a02881919e.sql`
11. `20250929132951_56305a63-e5e8-4601-a5a5-39c6f8cfa523.sql`
12. `20250929225924_16690b65-63db-4308-97d8-ab52a3544678.sql`
13. `20250930232000_eb59c6f4-dc59-494f-bd80-ba5a268e94ab.sql`
14. `20251001001456_b85f66fe-1736-4b41-aed0-d9a7bf18af99.sql`
15. `20251001054721_e2ad9a3a-a622-446b-b010-480c5bba5e29.sql`
16. `20251004224855_655d2464-23e7-4a25-b899-f8286af655df.sql`
17. `20251005021851_13776f8e-d34a-473c-a5b6-9a4eb4397abc.sql`
18. `20251210135055_5e1d2c84-b682-42e3-a0ed-f467ace0b726.sql`
19. `20251210142314_91fe1ed7-16c3-4cd1-b522-252b948e04f4.sql` - Referee questions

## 🆘 Troubleshooting

### "relation does not exist" error
- Make sure you ran all migrations in order
- Check you're connected to the correct database branch

### "password authentication failed"
- Double-check the connection string is copied correctly
- Ensure no extra spaces or line breaks in the connection string

### "SSL connection required"
- Make sure connection string includes `?sslmode=require`

## 🎯 Next Steps

After database setup:

1. [ ] Migrate data from Supabase (if you have existing data)
2. [ ] Set up Cloudflare R2 for file storage
3. [ ] Test all features on production
4. [ ] Change default admin password

## 📞 Quick Commands Reference

```bash
# Connect to Development DB
psql "postgresql://neondb_owner:npg_nAC5hlKqTN9b@ep-broad-sky-afaozh9y-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require"

# Connect to Production DB
psql "postgresql://neondb_owner:npg_nAC5hlKqTN9b@ep-shy-recipe-af4o35w7-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require"

# Run all migrations (Development)
for file in supabase/migrations/*.sql; do psql "postgresql://neondb_owner:npg_nAC5hlKqTN9b@ep-broad-sky-afaozh9y-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require" -f "$file"; done

# Run all migrations (Production)
for file in supabase/migrations/*.sql; do psql "postgresql://neondb_owner:npg_nAC5hlKqTN9b@ep-shy-recipe-af4o35w7-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require" -f "$file"; done
```

---

**Status**: Vercel deployed ✅ | Database setup in progress ⏳
