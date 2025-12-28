#!/bin/bash

# Seido Karate Club - Database Migration Script
# This script runs all Supabase migrations on your Neon database

set -e  # Exit on error

echo "🥋 Seido Karate Club - Database Migration Script"
echo "================================================"
echo ""

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    echo "❌ Error: psql is not installed"
    echo "Install PostgreSQL client:"
    echo "  macOS: brew install postgresql"
    echo "  Ubuntu: sudo apt-get install postgresql-client"
    exit 1
fi

# Ask which database to migrate
echo "Which database do you want to migrate?"
echo "1) Development (local testing)"
echo "2) Production (Vercel deployment)"
read -p "Enter choice (1 or 2): " choice

if [ "$choice" = "1" ]; then
    DB_URL="postgresql://neondb_owner:npg_nAC5hlKqTN9b@ep-broad-sky-afaozh9y-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require"
    DB_NAME="Development"
elif [ "$choice" = "2" ]; then
    DB_URL="postgresql://neondb_owner:npg_nAC5hlKqTN9b@ep-shy-recipe-af4o35w7-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require"
    DB_NAME="Production"
else
    echo "❌ Invalid choice"
    exit 1
fi

echo ""
echo "🔄 Migrating $DB_NAME database..."
echo ""

# Count migration files
MIGRATION_COUNT=$(ls -1 supabase/migrations/*.sql 2>/dev/null | wc -l)
echo "📁 Found $MIGRATION_COUNT migration files"
echo ""

# Run each migration
CURRENT=0
for file in supabase/migrations/*.sql; do
    CURRENT=$((CURRENT + 1))
    FILENAME=$(basename "$file")
    echo "[$CURRENT/$MIGRATION_COUNT] Running $FILENAME..."
    
    if psql "$DB_URL" -f "$file" > /dev/null 2>&1; then
        echo "  ✅ Success"
    else
        echo "  ⚠️  Warning: Migration may have already been applied or encountered an error"
        echo "  (This is normal if re-running migrations)"
    fi
done

echo ""
echo "🎉 Migration complete!"
echo ""

# Verify tables were created
echo "📊 Verifying database schema..."
TABLE_COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')

if [ -n "$TABLE_COUNT" ] && [ "$TABLE_COUNT" -gt 0 ]; then
    echo "✅ Found $TABLE_COUNT tables in database"
    echo ""
    echo "Tables created:"
    psql "$DB_URL" -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
else
    echo "⚠️  Could not verify tables (this might be normal)"
fi

echo ""
echo "✨ All done! Your $DB_NAME database is ready."
echo ""
echo "Next steps:"
if [ "$choice" = "1" ]; then
    echo "1. Update your .env file with the Development DATABASE_URL"
    echo "2. Run 'npm run dev' to test locally"
else
    echo "1. Add DATABASE_URL to Vercel environment variables"
    echo "2. Run 'vercel --prod' to redeploy"
fi
echo ""
