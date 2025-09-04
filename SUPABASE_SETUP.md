# Supabase Setup Guide

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New project"
3. Choose your organization
4. Set project name (e.g., "whop-swapboard")
5. Set database password (save this for later)
6. Select a region close to your users
7. Click "Create new project"

## 2. Get Your API Keys

Once your project is created:

1. Go to **Settings > API** in your Supabase dashboard
2. Copy the following values:

   - **Project URL**: `https://your-project-ref.supabase.co`
   - **anon public key**: `eyJ...` (starts with eyJ)
   - **service_role key**: `eyJ...` (starts with eyJ, different from anon)

## 3. Update Environment Variables

Replace the values in your `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-from-dashboard
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-from-dashboard

# Database URL for Prisma
DATABASE_URL=postgresql://postgres:your-database-password@db.your-project-ref.supabase.co:5432/postgres
```

## 4. Run Database Migrations

After updating your environment variables:

```bash
# Generate Prisma client
pnpm prisma generate

# Push schema to Supabase
pnpm prisma db push

# (Optional) Seed the database
pnpm db:seed
```

## 5. Verify Setup

1. Check that your database schema is created in Supabase Dashboard > Table Editor
2. Test API routes by running the development server
3. Verify no database connection errors in the console

## 6. Optional: Set up Supabase CLI (for type generation)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Generate TypeScript types
supabase gen types typescript --project-id your-project-ref > lib/database.types.ts
```

## Environment Variables Reference

| Variable | Description | Where to find |
|----------|-------------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your project URL | Settings > API > Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anonymous/public key | Settings > API > Project API keys > anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (admin) | Settings > API > Project API keys > service_role |
| `DATABASE_URL` | PostgreSQL connection string | Settings > Database > Connection string > URI |

## Security Notes

- **Never commit** your `.env.local` or `.env` files to version control
- The service role key has admin privileges - keep it secure
- Only use service role key on the server side
- Use anon key for client-side operations
