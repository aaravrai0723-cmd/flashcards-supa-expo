# Flashcards App - Supabase + Expo

A modern flashcards application built with Expo (React Native), Supabase, and TypeScript. Features AI-powered content generation, media processing, and comprehensive quiz functionality.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │   Web App       │    │   Functions     │
│   (Expo RN)     │    │   (Future)      │    │   (Edge)        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Supabase      │
                    │   - Database    │
                    │   - Storage     │
                    │   - Auth        │
                    │   - RLS         │
                    └─────────────────┘
```

## 📁 Project Structure

```
flashcards-supa-expo/
├── apps/
│   ├── mobile/                 # Expo React Native app
│   └── functions/              # Supabase Edge Functions
│       ├── _internals/         # Shared utilities
│       ├── ingest-webhook/      # Storage upload handler
│       ├── worker-pull/        # Job processing worker
│       ├── cron-tick/          # Scheduled job trigger
│       ├── health/             # Health monitoring
│       └── monitoring/          # Metrics and alerts
├── packages/
│   └── sdk/                    # Type-safe Supabase SDK
│       ├── src/
│       │   ├── client.ts       # Supabase client setup
│       │   ├── repos/          # Data repositories
│       │   └── types/          # Generated TypeScript types
│       ├── package.json
│       └── tsconfig.json
├── supabase/
│   ├── migrations/             # SQL migrations
│   ├── seed.sql                # Seed data
│   └── config.toml             # Supabase configuration
├── scripts/                    # Utility scripts
└── docs/                       # Documentation
```

### Architecture

This is a **workspace monorepo** using npm/pnpm workspaces:
- **Mobile app** imports shared SDK for type-safe database access
- **Edge functions** can also import SDK for consistency
- **SDK package** is built with TypeScript and shared across apps

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+
- **Package Manager**: npm (included with Node.js), pnpm 8+, or bun 1.0+
- **Supabase CLI** (for database management)
- **Expo CLI** (for mobile development)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd flashcards-supa-expo

# Install dependencies (choose one)
npm install
# or
pnpm install
# or
bun install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values
```

### Environment Setup

Create `.env.local` in the project root (or copy from `.env.example`):

```bash
cp .env.example .env.local
# Then edit .env.local with your actual values
```

Your `.env.local` should look like this:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Database Password (required for db:seed script)
SUPABASE_DB_PASSWORD=your_database_password

# Function Security
FILE_PROCESSING_WEBHOOK_SECRET=your_webhook_secret
JOB_WORKER_SECRET=your_worker_secret
CRON_SECRET=your_cron_secret

# AI Provider (choose one)
VISION_PROVIDER=openai
OPENAI_API_KEY=your_openai_key
```

⚠️ **Important**: Never commit `.env.local` to git - it's already in `.gitignore`

#### How to Get Environment Keys

**Supabase Keys** (Required for database and auth):
1. **`EXPO_PUBLIC_SUPABASE_URL`** and **`EXPO_PUBLIC_SUPABASE_ANON_KEY`**:
   - Go to your [Supabase Dashboard](https://supabase.com/dashboard)
   - Select your project
   - Navigate to **Settings > API**
   - Copy the **Project URL** and **anon/public** key

2. **`SUPABASE_SERVICE_ROLE_KEY`**:
   - In the same **Settings > API** page
   - Copy the **service_role** key (bottom section)
   - ⚠️ **Important**: This key bypasses Row Level Security - keep it secret and never expose it client-side

3. **`SUPABASE_DB_PASSWORD`** (optional - only if using `db:seed:psql`):
   - Go to **Settings > Database** in your Supabase dashboard
   - Find the **Database Password** section
   - If you don't have it saved, you'll need to reset it
   - Only needed if you want to seed via direct psql connection
   - **Recommended**: Use the Supabase dashboard SQL Editor instead (no password needed)

**Function Security Secrets** (Required for background processing):

Generate secure random strings for webhook and worker authentication:

```bash
# Generate all three secrets at once
openssl rand -base64 32  # Use for FILE_PROCESSING_WEBHOOK_SECRET
openssl rand -base64 32  # Use for JOB_WORKER_SECRET
openssl rand -base64 32  # Use for CRON_SECRET
```

What each secret is for:
- **`FILE_PROCESSING_WEBHOOK_SECRET`**: Secures the storage upload webhook
- **`JOB_WORKER_SECRET`**: Protects the background job worker endpoint
- **`CRON_SECRET`**: Secures the scheduled task trigger endpoint

**OpenAI API Key** (Optional - for AI features):

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click **"Create new secret key"**
4. Copy the key immediately (you won't see it again)
5. Add to `.env.local` as `OPENAI_API_KEY`

Note: Only required if using AI-powered card generation features

---

**Quick Setup Summary:**

1. Copy `.env.example` to `.env.local`
2. Get Supabase keys from dashboard (URL, anon key, service role key, database password)
3. Generate three security secrets with `openssl rand -base64 32`
4. (Optional) Add OpenAI API key for AI features
5. Save `.env.local` and proceed with database setup

### Database Setup

```bash
# Link to your Supabase project (if not already done)
npx supabase link --project-ref YOUR_PROJECT_REF

# Apply migrations
npx supabase db push

# Seed initial data (optional - adds starter data like subjects, grade levels, tags)
# This will show you instructions for manual seeding via Supabase dashboard
npm run db:seed

# Alternatively, if you have psql installed and configured:
# npm run db:seed:psql

# Generate TypeScript types from remote database
npm run gen:types
# or pnpm gen:types
# or bun run gen:types

# Note: This generates types at packages/sdk/src/types/database.ts
# Re-run this command whenever you update your database schema
```

### Development

```bash
# Start mobile app
npm run dev
# or npm run dev:mobile
# or pnpm dev
# or bun run dev

# Build SDK package (for Edge Functions or manual builds)
npm run build:sdk
# or pnpm build:sdk
# or bun run build:sdk

# Build everything
npm run build
# or pnpm build
# or bun run build

# Run linting across all workspaces
npm run lint
# or pnpm lint
# or bun run lint

# Run type checking across all workspaces
npm run typecheck
# or pnpm typecheck
# or bun run typecheck
```

## 📱 Mobile App (Expo)

The mobile app is built with Expo and React Native, featuring:

- **Cross-platform** iOS and Android support
- **Type-safe** Supabase integration
- **OAuth Authentication** - Google and Apple Sign In
- **Offline-first** architecture with sync
- **AI-powered** content generation
- **Media processing** for images, videos, and PDFs
- **Quiz functionality** with multiple question types

### Authentication

The app supports multiple authentication methods:
- **Magic Link** - Email-based passwordless authentication
- **Google OAuth** - Sign in with Google account
- **Apple Sign In** - Sign in with Apple ID (iOS only)

To set up OAuth providers, see the [OAuth Setup Guide](docs/OAUTH_SETUP.md).

### Key Features

- **Deck Management**: Create, organize, and share flashcard decks
- **Smart Cards**: AI-generated cards from uploaded content
- **Media Support**: Images, videos, PDFs with automatic processing
- **Quiz Modes**: Practice, test, and review modes
- **Progress Tracking**: Learning analytics and performance metrics
- **Collaboration**: Share decks and collaborate with others

### Development

```bash
# Start Expo development server
cd apps/mobile
npx expo start

# Run on specific platform
npx expo start --ios
npx expo start --android

# Build for production
npx expo build:android
npx expo build:ios
```

## ⚡ Edge Functions

Serverless functions for background processing:

### Core Functions

- **`ingest-webhook`**: Handles storage uploads and creates processing jobs
- **`worker-pull`**: Processes queued jobs (image/video/PDF analysis)
- **`cron-tick`**: Scheduled job processing trigger
- **`health`**: System health monitoring and diagnostics
- **`monitoring`**: Metrics, alerts, and dashboard data

### Job Processing Pipeline

```
File Upload → Storage Webhook → Job Queue → AI Processing → Media Assets + Cards
```

### Supported Job Types

- **Image Processing**: AI description, thumbnail generation, draft cards
- **Video Processing**: Keyframe extraction, AI analysis, transcript handling
- **PDF Processing**: Page extraction, text analysis, multiple cards
- **AI Card Generation**: Content-based card creation with custom strategies

### Development

```bash
# Serve functions locally
supabase functions serve --env-file .env.local

# Deploy functions
supabase functions deploy

# View function logs
supabase functions logs ingest-webhook
```

## 🗄️ Database Schema

### Core Tables

- **`users`**: User profiles and preferences
- **`decks`**: Flashcard deck collections
- **`cards`**: Individual flashcards with content
- **`media_assets`**: Images, videos, PDFs with metadata
- **`jobs`**: Background processing queue
- **`quizzes`**: Quiz sessions and attempts

### Educational Taxonomy

- **`subjects`**: Hierarchical subject categories
- **`topics`**: Specific topics within subjects
- **`grade_levels`**: Educational grade levels
- **`standards`**: Educational standards (CCSS, NGSS, etc.)
- **`tags`**: Flexible content tagging

### Security

- **Row Level Security (RLS)** on all tables
- **Storage bucket policies** with proper access controls
- **Public/private deck visibility** with cascading permissions
- **Service role access** for background jobs

## 🔧 SDK Package

The SDK package provides a type-safe Supabase client with repository pattern for data access. It's shared between the mobile app and edge functions.

### Features

- **Type-safe database access** - Generated TypeScript types from your schema
- **Repository pattern** - Clean abstractions for data operations
- **Supabase client** - Pre-configured with auth and realtime
- **Shared logic** - Used by both mobile app and edge functions

### Usage in Mobile App

```typescript
import { decksRepo, cardsRepo, mediaRepo, jobsRepo } from '@flashcards/sdk';

// Create a deck
const deck = await decksRepo.createDeck({
  title: 'Biology Basics',
  description: 'Fundamental biology concepts',
  visibility: 'public'
});

// Upload and process media
const { path } = await mediaRepo.uploadFile(file, 'image.jpg', 'ingest');
const { jobId } = await jobsRepo.enqueueIngestJob(path, 'image/jpeg');

// Create cards
const card = await cardsRepo.createCard({
  deck_id: deck.id,
  prompt_text: 'What is photosynthesis?',
  answer_text: 'The process by which plants convert light into energy'
});
```

### Building the SDK

The SDK is automatically built when needed, but you can build it manually:

```bash
npm run build:sdk
```

This generates the `dist/` folder with compiled JavaScript and TypeScript declarations.

## 📊 Monitoring & Observability

### Health Checks

```bash
# Basic health check
curl https://your-project.supabase.co/functions/v1/health

# Detailed system health
curl "https://your-project.supabase.co/functions/v1/health?type=detailed"

# Queue health
curl "https://your-project.supabase.co/functions/v1/health?type=queue"
```

### Metrics & Alerts

```bash
# System metrics
curl https://your-project.supabase.co/functions/v1/monitoring/metrics

# System alerts
curl https://your-project.supabase.co/functions/v1/monitoring/alerts

# Dashboard data
curl https://your-project.supabase.co/functions/v1/monitoring/dashboard
```

### Monitoring Features

- **Real-time health monitoring** with multiple check types
- **Automated alerting** for stuck jobs, high failure rates, queue issues
- **Performance metrics** and processing time analytics
- **User activity tracking** and system insights
- **Automated cleanup** for maintenance

## 🧪 Testing

### Local Testing

```bash
# Test functions locally
supabase functions serve --env-file .env.local

# Test webhook
curl -X POST http://localhost:54321/functions/v1/ingest-webhook \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: sha256=..." \
  -d '{"type":"INSERT","table":"objects","record":{"bucket_id":"ingest","name":"test.jpg"}}'

# Test worker
curl -X POST http://localhost:54321/functions/v1/worker-pull \
  -H "Authorization: Bearer your_worker_secret"
```

### Comprehensive Testing

See `apps/functions/tests/test-examples.md` for:
- Load testing scripts
- Security testing scenarios
- Error handling tests
- Performance benchmarks

## 🚀 Deployment

### Supabase Functions

```bash
# Deploy all functions
supabase functions deploy

# Deploy specific functions
supabase functions deploy ingest-webhook worker-pull cron-tick health monitoring

# Set environment variables
supabase secrets set FILE_PROCESSING_WEBHOOK_SECRET=your_secret
supabase secrets set JOB_WORKER_SECRET=your_secret
supabase secrets set OPENAI_API_KEY=your_key
```

### Mobile App

```bash
# Build for production
cd apps/mobile
npx expo build:android
npx expo build:ios

# Publish to app stores
npx expo upload:android
npx expo upload:ios
```

### Database

```bash
# Apply migrations
supabase db push

# Generate types
pnpm gen:types

# Set up cron jobs
# (See infra/supabase/README.md for details)
```

## 🔒 Security

### Authentication & Authorization

- **Supabase Auth** for user authentication
- **Row Level Security (RLS)** for data access control
- **Service role** for background processing
- **HMAC signatures** for webhook verification

### Data Protection

- **Encrypted storage** for sensitive data
- **Secure file uploads** with validation
- **Rate limiting** to prevent abuse
- **Input sanitization** and validation

### Best Practices

- Environment variables for secrets
- Regular security audits
- Automated vulnerability scanning
- Secure coding practices

## 📈 Performance

### Optimization Features

- **Database indexing** for fast queries
- **Connection pooling** for efficient database access
- **Caching strategies** for frequently accessed data
- **Background processing** for heavy operations
- **Rate limiting** to prevent system overload

### Monitoring

- **Real-time metrics** collection
- **Performance analytics** and insights
- **Automated alerting** for issues
- **Load testing** and capacity planning

## 🤝 Contributing

### Development Workflow

1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Test** thoroughly
5. **Submit** a pull request

### Code Standards

- **TypeScript** for type safety
- **ESLint** for code quality
- **Prettier** for formatting
- **Conventional commits** for changelog generation

### Testing Requirements

- Unit tests for new features
- Integration tests for API endpoints
- End-to-end tests for critical paths
- Performance tests for optimization

## 📚 Documentation

- **[Database Schema](infra/supabase/README.md)** - Complete database documentation
- **[Functions Guide](apps/functions/README.md)** - Edge functions documentation
- **[Testing Examples](apps/functions/tests/test-examples.md)** - Comprehensive testing guide
- **[SDK Documentation](packages/sdk/README.md)** - Type-safe client documentation

## 🆘 Troubleshooting

### Common Issues

1. **Database connection errors**: Check Supabase URL and keys
2. **Function deployment failures**: Verify environment variables
3. **Mobile build issues**: Check Expo CLI and dependencies
4. **Job processing stuck**: Check worker logs and database state

### Getting Help

- Check the documentation in each package
- Review the troubleshooting guides
- Check GitHub issues for similar problems
- Join the community discussions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Supabase** for the backend infrastructure
- **Expo** for the mobile development platform
- **OpenAI** for AI capabilities
- **Community** for contributions and feedback

---

**Built with ❤️ using Expo, Supabase, and TypeScript**
