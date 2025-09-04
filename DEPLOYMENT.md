# Deployment Guide

## Deploying to Vercel

This application is ready for deployment to Vercel. Follow these steps:

### 1. Connect to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository (https://github.com/TheDenz3l/SB.git)
4. Select the project and click "Import"

### 2. Configure Environment Variables
During the import process, Vercel will ask for environment variables. You'll need to add:

```env
WHOP_API_KEY=your_actual_whop_api_key
NEXT_PUBLIC_WHOP_APP_ID=your_actual_app_id
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
DATABASE_URL=postgresql://postgres.[project-id]:[password]@aws-1-us-east-1.pooler.supabase.com:5432/postgres
WHOP_WEBHOOK_SECRET=your_webhook_secret
WHOP_UTM_HMAC_SECRET=your_utm_hmac_secret
IP_HASH_SALT=your_ip_hash_salt
```

### 3. Configure Build Settings
- **Build Command**: `pnpm build`
- **Output Directory**: `.next`
- **Install Command**: `pnpm install`

### 4. Configure Project Settings
- **Framework Preset**: Next.js
- **Root Directory**: `/`
- **Build Command**: `next build`

### 5. Add Environment Variables in Vercel Dashboard
After deployment, go to your project settings:
1. Navigate to "Settings" → "Environment Variables"
2. Add all the required environment variables listed above
3. Make sure to set the correct values from your Whop and Supabase dashboards

### 6. Configure Whop App Settings
In your Whop Developer Dashboard:
1. Set the Base URL to your Vercel deployment URL
2. Set App Path to `/experiences/[experienceId]`
3. Set Discover Path to `/discover`
4. Set Webhook URL to `/api/webhooks/payment`

### 7. Database Setup for Production
Make sure your Supabase database is properly configured:
1. Run database migrations if not already done
2. Ensure the session pooler connection is working
3. Verify all required tables exist

### 8. Test the Deployment
After deployment completes:
1. Visit your discover page: `https://your-app.vercel.app/discover`
2. Test the experience page: `https://your-app.vercel.app/experiences/test-experience`
3. Verify API endpoints are working: `https://your-app.vercel.app/api/health`

## Environment Variable Requirements

### Required Variables
- `WHOP_API_KEY` - From Whop Developer Dashboard
- `NEXT_PUBLIC_WHOP_APP_ID` - From Whop Developer Dashboard
- `NEXT_PUBLIC_SUPABASE_URL` - From Supabase Project Settings
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - From Supabase Project Settings
- `SUPABASE_SERVICE_ROLE_KEY` - From Supabase Project Settings
- `DATABASE_URL` - PostgreSQL connection string (use session pooler)
- `WHOP_WEBHOOK_SECRET` - Generate in Whop Dashboard
- `WHOP_UTM_HMAC_SECRET` - Generate a secure random string
- `IP_HASH_SALT` - Generate a secure random string

### Optional Variables
- `NEXT_PUBLIC_WHOP_PARENT_ORIGIN` - For development embeds
- `CRON_SECRET` - For scheduled jobs
- `NEXT_PUBLIC_BOOST_PLAN_ID_ONE` - For boost functionality
- `NEXT_PUBLIC_BOOST_PLAN_ID_FIVE` - For boost functionality

## Troubleshooting Deployment Issues

### Database Connection Issues
If you encounter database connection errors:
1. Verify the DATABASE_URL uses the session pooler format
2. Check that your Supabase project is not paused
3. Ensure the database password is correct
4. Verify network connectivity from Vercel to Supabase

### Whop Integration Issues
If Whop integration isn't working:
1. Double-check WHOP_API_KEY and NEXT_PUBLIC_WHOP_APP_ID
2. Verify the webhook URL is correctly configured in Whop Dashboard
3. Check that WHOP_WEBHOOK_SECRET matches between Vercel and Whop

### Build Failures
If the build fails:
1. Check that all environment variables are properly set
2. Verify pnpm dependencies are correctly installed
3. Ensure the build command is `pnpm build`
4. If you see TypeScript errors from `@whop/*` SDK types (e.g. `Expected 1 arguments, but got 0` on `getTopLevelUrlData`), set an env var `NEXT_IGNORE_TYPE_ERRORS=1` in Vercel to bypass third‑party type noise. This repo ships a local type shim to avoid this.
5. If you hit permission errors writing `.next`, set `NEXT_DIST_DIR` to a writable folder (e.g. `.next`) — the config auto‑falls back to a user‑writable dist dir.

## Production Best Practices

### Security
- Never commit sensitive environment variables to version control
- Use Vercel's environment variable encryption
- Regularly rotate secrets and API keys
- Monitor access logs and error reports

### Performance
- Enable Vercel's automatic static optimization
- Use ISR (Incremental Static Regeneration) where appropriate
- Configure proper caching headers
- Monitor performance metrics

### Monitoring
- Set up error tracking with Sentry or similar
- Configure uptime monitoring
- Set up alerts for critical errors
- Monitor database performance

## Custom Domain Setup

To use a custom domain:
1. In Vercel Dashboard, go to your project
2. Navigate to "Settings" → "Domains"
3. Add your custom domain
4. Follow the DNS configuration instructions
5. Update your Whop app settings with the new domain

## CI/CD Pipeline

This project uses GitHub for version control. For automated deployments:
1. Vercel automatically deploys on pushes to main branch
2. Create pull requests for feature branches
3. Use Vercel's preview deployments for testing
4. Set up branch protection rules in GitHub

## Backup and Recovery

### Database Backups
- Supabase provides automatic backups
- Configure point-in-time recovery if needed
- Regularly test backup restoration procedures

### Code Backups
- GitHub repository serves as code backup
- Consider additional backup strategies for critical data
- Document recovery procedures

## Scaling Considerations

### Database Scaling
- Monitor connection pool usage
- Optimize queries and add indexes as needed
- Consider read replicas for high-traffic scenarios

### Application Scaling
- Vercel automatically scales Next.js applications
- Monitor function execution times
- Optimize API routes for performance

This deployment guide should help you successfully deploy your Whop Swapboard application to Vercel with proper configuration and best practices.
