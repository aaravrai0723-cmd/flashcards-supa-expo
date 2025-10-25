# Supabase Setup Guide

This guide covers setting up and managing your Supabase project for the flashcards application.

## Prerequisites

- Node.js 18+ installed
- Supabase CLI installed (`npm install -g supabase`)
- Git repository initialized

## Initial Setup

### 1. Initialize Supabase

```bash
# Initialize Supabase in your project
supabase init

# Link to your remote Supabase project
supabase link --project-ref YOUR_PROJECT_REF
```

### 2. Environment Variables

Create a `.env.local` file in your project root:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# For server-side usage (functions)
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 3. Database Setup

```bash
# Apply all migrations to your database
supabase db push

# Run seed data
supabase db seed
```

## Database Management

### Running Migrations

```bash
# Push local migrations to remote database
supabase db push

# Pull remote changes to local
supabase db pull

# Reset database (WARNING: This will delete all data)
supabase db reset
```

### Type Generation

Generate TypeScript types from your database schema:

```bash
# Generate types from linked project
supabase gen types typescript --linked > packages/sdk/src/types/database.ts
```

### Seeding Data

```bash
# Run all seed files
supabase db seed

# Run specific seed file
supabase db seed --file 001_seed_minimal.sql
```

## Storage Setup

The application uses three storage buckets:

- **media**: User-uploaded media files (images, videos, PDFs)
- **derived**: Generated/processed files (thumbnails, transcoded videos)
- **ingest**: Temporary files during processing

Storage buckets are automatically created by the migration files.

## Row Level Security (RLS)

All tables have RLS enabled with appropriate policies:

- Users can only access their own data
- Public decks and cards are readable by everyone
- Media assets follow deck visibility rules
- Service role has full access for background jobs

## Background Jobs

The system includes a job queue for:

- **ingest_image**: Process uploaded images
- **ingest_video**: Process uploaded videos  
- **ingest_pdf**: Extract content from PDFs
- **ai_generate_cards**: Generate cards using AI

Jobs are automatically created when files are uploaded to the `ingest_files` table.

## Development Workflow

### 1. Making Schema Changes

```bash
# Create a new migration
supabase migration new your_migration_name

# Edit the migration file in db/migrations/
# Apply changes
supabase db push
```

### 2. Testing Changes

```bash
# Start local Supabase (requires Docker)
supabase start

# Run migrations locally
supabase db reset

# Test your changes
supabase db push
```

### 3. Deploying Changes

```bash
# Generate types after schema changes
supabase gen types typescript --linked > packages/sdk/src/types/database.ts

# Commit your changes
git add .
git commit -m "Update database schema"
git push
```

## Useful Commands

### Database Operations

```bash
# View current migrations
supabase migration list

# Check database status
supabase status

# Access database shell
supabase db shell

# Generate migration from local changes
supabase db diff -f migration_name
```

### Project Management

```bash
# View project info
supabase projects list

# Switch projects
supabase link --project-ref NEW_PROJECT_REF

# View logs
supabase logs
```

### Type Safety

```bash
# Update types after schema changes
supabase gen types typescript --linked > packages/sdk/src/types/database.ts

# Verify types compile
cd packages/sdk && npm run build
```

## Troubleshooting

### Common Issues

1. **Migration conflicts**: Use `supabase db reset` to start fresh
2. **RLS blocking queries**: Check your policies and user authentication
3. **Storage upload failures**: Verify bucket policies and file size limits
4. **Type generation errors**: Ensure your database schema is valid

### Getting Help

- Check Supabase documentation: https://supabase.com/docs
- Review migration files in `db/migrations/`
- Check RLS policies in `002_storage_and_rls.sql`
- Verify environment variables are set correctly

## Production Considerations

1. **Backup Strategy**: Enable automatic backups in Supabase dashboard
2. **Monitoring**: Set up alerts for job failures and storage usage
3. **Performance**: Monitor query performance and add indexes as needed
4. **Security**: Regularly review RLS policies and access patterns
5. **Scaling**: Consider read replicas for high-traffic scenarios

## File Structure

```
db/
├── migrations/
│   ├── 001_init_core.sql          # Core tables and indexes
│   ├── 002_storage_and_rls.sql    # Storage buckets and RLS policies
│   └── 003_triggers.sql           # Triggers and functions
└── seeds/
    └── 001_seed_minimal.sql       # Initial data

packages/sdk/src/
├── client.ts                      # Supabase client setup
├── repos/                         # Repository classes
│   ├── decks.ts
│   ├── cards.ts
│   ├── media.ts
│   └── jobs.ts
└── types/
    └── database.ts                # Generated TypeScript types
```
