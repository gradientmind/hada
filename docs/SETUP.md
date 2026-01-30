# Setup Guide

Complete guide to setting up Hada for local development and production deployment.

## Prerequisites

- **Node.js 18+** - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** - [Download](https://git-scm.com/)
- **Supabase account** - [Sign up](https://supabase.com) (free tier available)
- **Railway account** - [Sign up](https://railway.app) (for deployment)

## Local Development Setup

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd hada
npm install
```

### 2. Set Up Supabase

#### Create a Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name:** hada (or your preference)
   - **Database Password:** Generate a strong password (save this!)
   - **Region:** Choose closest to your users
5. Click "Create new project" and wait for setup (~2 minutes)

#### Get Your API Keys

1. Go to **Project Settings** (gear icon) → **API**
2. Copy these values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### Run Database Migration

1. Go to **SQL Editor** in Supabase dashboard
2. Click "New query"
3. Copy the contents of `supabase/migrations/001_initial_schema.sql`
4. Paste and click "Run"
5. You should see "Success. No rows returned"

#### Enable Google OAuth (Optional)

1. Go to **Authentication** → **Providers**
2. Find **Google** and enable it
3. You'll need to set up a Google Cloud project:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project
   - Enable the Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `https://<your-supabase-url>/auth/v1/callback`
4. Enter your Google Client ID and Secret in Supabase

### 3. Set Up Google Calendar & Gmail Integration (Phase 3)

To enable Google Calendar and Gmail features, you need separate OAuth credentials:

#### Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable required APIs:
   - Go to **APIs & Services** → **Library**
   - Search and enable **Google Calendar API**
   - Search and enable **Gmail API**

#### Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client ID**
3. Configure OAuth consent screen (if not done):
   - User Type: **External**
   - App name: **Hada**
   - User support email: your email
   - Scopes: Add `calendar` and `gmail.modify`
   - Test users: Add your email for testing
4. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: **Hada Web App**
   - Authorized redirect URIs:
     - Development: `http://localhost:3000/api/auth/google/callback`
     - Production: `https://your-domain.com/api/auth/google/callback`
5. Copy **Client ID** and **Client Secret**

#### Run Additional Migration

Run the Phase 3 migration in Supabase SQL Editor:

```sql
-- Copy contents of supabase/migrations/002_add_user_permissions.sql
```

### 4. Configure Environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```bash
# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google OAuth (Phase 3 - for Calendar & Gmail integration)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Production Deployment (Railway)

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo>
git push -u origin main
```

### 2. Deploy to Railway

1. Go to [railway.app](https://railway.app) and sign in
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Railway will auto-detect Next.js

### 3. Configure Environment Variables

In Railway dashboard:

1. Click on your service
2. Go to **Variables** tab
3. Add:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### 4. Configure Domain (Optional)

1. Go to **Settings** tab
2. Under **Domains**, click "Generate Domain" or add a custom domain

### 5. Update Supabase Redirect URLs

If using OAuth:

1. Go to Supabase → **Authentication** → **URL Configuration**
2. Add your Railway domain to:
   - **Site URL:** `https://your-app.railway.app`
   - **Redirect URLs:** `https://your-app.railway.app/auth/callback`

## Troubleshooting

### "Missing Supabase environment variables"

- Ensure `.env.local` exists and has correct values
- Restart the dev server after changing env vars

### OAuth redirect not working

- Check redirect URLs in Supabase match your app URL exactly
- For local dev, ensure `http://localhost:3000/auth/callback` is in redirect URLs

### Database migration errors

- Ensure you're running the migration in the SQL Editor, not CLI
- Check for any existing tables that might conflict

### Build fails on Railway

- Check that all environment variables are set in Railway
- View build logs for specific errors

## Next Steps

After setup, you can:

1. Create an account at `/auth/signup`
2. Access the chat interface at `/chat`
3. Start building Phase 2 (OpenClaw integration)
