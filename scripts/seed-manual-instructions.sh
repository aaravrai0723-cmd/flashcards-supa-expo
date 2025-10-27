#!/bin/bash
# Display instructions for manual seeding via Supabase dashboard

set -e

# Load environment variables
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
fi

# Extract project ref from URL
PROJECT_REF=$(echo $EXPO_PUBLIC_SUPABASE_URL | sed -n 's/.*\/\/\([^.]*\).*/\1/p')

echo "📋 Manual Database Seeding Instructions"
echo "========================================"
echo ""
echo "Since direct psql connection requires network configuration,"
echo "the easiest way to seed is via the Supabase SQL Editor:"
echo ""
echo "Step 1: Open the SQL Editor"
echo "   → https://supabase.com/dashboard/project/$PROJECT_REF/sql"
echo ""
echo "Step 2: Copy the seed file contents"
echo "   Run: cat supabase/seed.sql | pbcopy"
echo "   (or manually open supabase/seed.sql and copy the contents)"
echo ""
echo "Step 3: Paste and execute in SQL Editor"
echo "   → Paste the SQL into the editor"
echo "   → Click 'Run' or press Cmd+Enter"
echo ""
echo "✅ Your database will be seeded with starter data:"
echo "   • Grade levels (K-12, college, etc.)"
echo "   • Subjects (Math, Science, Language Arts, etc.)"
echo "   • Topics within subjects"
echo "   • Common tags"
echo "   • Sample educational standards"
echo ""

# Optionally display the seed file
read -p "Would you like to see the seed file contents now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  cat supabase/seed.sql
fi
