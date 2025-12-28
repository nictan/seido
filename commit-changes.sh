#!/bin/bash

# Seido Karate Club - GitHub Commit Helper
# Commits recent changes and pushes to GitHub

set -e

echo "🥋 Seido Karate Club - GitHub Commit Helper"
echo "==========================================="
echo ""

# Check if we're in a git repository
if [ ! -d .git ]; then
    echo "❌ Error: Not a git repository"
    exit 1
fi

# Show current status
echo "📊 Current Git Status:"
echo ""
git status --short
echo ""

# Ask for confirmation
read -p "Do you want to commit these changes? (y/n): " confirm

if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "❌ Cancelled"
    exit 0
fi

echo ""
echo "📝 Committing changes..."

# Add all files
git add .

# Create commit with descriptive message
git commit -m "feat: add Vercel and Neon deployment configuration

- Add deployment status tracking (DEPLOYMENT_STATUS.md)
- Add Neon database setup guide (NEON_SETUP.md)
- Add Vercel deployment guide (VERCEL_SETUP.md)
- Add GitHub integration guide (GITHUB_SETUP.md)
- Add automated database migration script (migrate-database.sh)
- Update vercel.json for proper deployment
- Add separated theme configuration system
- Add comprehensive documentation"

echo "✅ Changes committed"
echo ""

# Ask about pushing
read -p "Push to GitHub? (y/n): " push_confirm

if [ "$push_confirm" = "y" ] || [ "$push_confirm" = "Y" ]; then
    echo ""
    echo "🚀 Pushing to GitHub..."
    
    # Get current branch
    BRANCH=$(git branch --show-current)
    
    # Push to remote
    git push seido "$BRANCH"
    
    echo ""
    echo "✅ Pushed to GitHub!"
    echo ""
    echo "🎉 Done! Your changes are now on GitHub."
    echo ""
    echo "Next steps:"
    echo "1. Check Vercel dashboard for automatic deployment"
    echo "2. Visit: https://vercel.com/nicorasutangmailcoms-projects/seido"
    echo "3. Verify deployment completes successfully"
else
    echo ""
    echo "⏸️  Changes committed locally but not pushed"
    echo "Run 'git push seido main' when ready to push"
fi

echo ""
