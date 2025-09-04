# Database Connection Troubleshooting

## Current Issue: `ENOTFOUND db.uehlnfqtubgfoxjpjmpw.supabase.co`

This error indicates that the database hostname cannot be resolved, which typically means:

### 1. 🔄 Supabase Project is Paused

**Most Common Cause**: New Supabase projects are paused after a period of inactivity.

**Solution**:
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Find your project: `uehlnfqtubgfoxjpjmpw`
3. If you see a "Paused" status, click **"Resume"** or **"Restore"**
4. Wait 2-3 minutes for the database to come online
5. Try running `pnpm test-db` again

### 2. 📝 Check Database Connection String

Your current DATABASE_URL:
```
postgresql://postgres:pWmPyeTyhRqDNbl7@db.uehlnfqtubgfoxjpjmpw.supabase.co:5432/postgres
```

**Verify in Supabase Dashboard**:
1. Go to **Settings > Database**
2. Look for **Connection String > URI**
3. Compare with your `.env.local` file
4. Make sure the hostname, password, and port match exactly

### 3. 🔑 Verify Database Password

The password in your connection string is: `pWmPyeTyhRqDNbl7`

**To check/reset**:
1. In Supabase Dashboard: **Settings > Database**
2. Scroll to **Database password**
3. If needed, click **Generate new password**
4. Update your `.env.local` and `.env` files with the new password

### 4. 🌐 Network/Firewall Issues

If the above steps don't work:
- Try connecting from a different network
- Check if your ISP/company firewall blocks port 5432
- Try using a VPN

### 5. 🕐 Project Initialization

New Supabase projects can take 5-10 minutes to fully initialize:
- Wait a bit longer if the project was just created
- Check the Supabase dashboard for any error messages

## Testing Steps

After making changes:

1. **Test environment variables**:
   ```bash
   pnpm validate-env
   ```

2. **Test database connection**:
   ```bash
   pnpm test-db
   ```

3. **Push database schema** (only after connection works):
   ```bash
   pnpm prisma:push
   ```

4. **Restart development server**:
   ```bash
   pnpm dev
   ```

## Common Solutions Summary

| Problem | Solution |
|---------|----------|
| `ENOTFOUND` error | Project is paused → Resume in dashboard |
| Authentication failed | Wrong password → Check/reset in dashboard |
| Connection timeout | Firewall issue → Try different network |
| Schema not found | Database not initialized → Wait longer |

## Need Help?

1. Check [Supabase Status](https://status.supabase.com/)
2. Visit the [Supabase Discord](https://discord.supabase.com/)
3. Review [Supabase Database docs](https://supabase.com/docs/guides/database)

## Vercel Build Issues

- Type error: `Expected 1 arguments, but got 0` at `getTopLevelUrlData`
  - Cause: Different `@whop/iframe` versions disagree on whether the options argument is required.
  - Fix: This repo ships `types/whop-iframe-shim.d.ts` to widen the signature to accept an optional argument. Client code calls `getTopLevelUrlData({})` for forward compatibility.
  - Last resort: set env `NEXT_IGNORE_TYPE_ERRORS=1` to bypass third‑party type noise during build.

- Permission denied writing `.next*` locally
  - Cause: a previous build created `.next-*` as `root`.
  - Fix: `next.config.mjs` now probes writability and falls back to `.next`. Override with `NEXT_DIST_DIR` if needed.
