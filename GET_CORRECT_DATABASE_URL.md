# 🔧 Get Correct Database URL from Supabase

## Problem Identified
The hostname `db.uehlnfqtubgfoxjpjmpw.supabase.co` doesn't exist in DNS, which means you're using an incorrect database connection string format.

## ✅ How to Get the Correct Database URL

### Step 1: Go to Supabase Dashboard
1. Visit [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click on your project: `uehlnfqtubgfoxjpjmpw`

### Step 2: Navigate to Database Settings
1. Click **Settings** in the left sidebar
2. Click **Database** 
3. Scroll down to find **Connection string**

### Step 3: Copy the Correct URL
Look for **Connection string** section. You'll see different formats:

#### Option A: Connection pooling (Recommended)
```
postgresql://postgres.uehlnfqtubgfoxjpjmpw:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

#### Option B: Direct connection
```
postgresql://postgres:[password]@db.uehlnfqtubgfoxjpjmpw.supabase.co:5432/postgres
```

#### Option C: Session pooling
```
postgresql://postgres.uehlnfqtubgfoxjpjmpw:[password]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

### Step 4: Update Your Environment Files

Replace `[password]` with your actual database password and update both files:

**File: `.env.local`**
```bash
DATABASE_URL=postgresql://postgres.uehlnfqtubgfoxjpjmpw:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

**File: `.env`**
```bash
DATABASE_URL=postgresql://postgres.uehlnfqtubgfoxjpjmpw:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

## 🔍 How to Find Your Database Password

If you don't know your database password:

1. In Supabase Dashboard > Settings > Database
2. Look for **Database password** section
3. If you forgot it, click **Generate new password**
4. Copy the new password and update your connection strings

## ⚡ Quick Test

After updating your environment files:

```bash
# Test the connection
pnpm test-connection-formats

# If successful, push your schema
pnpm prisma:push

# Then restart your dev server
pnpm dev
```

## 🎯 Expected Results

- ✅ Connection pooling URL should work
- ✅ `pnpm test-db` should show all connections successful
- ✅ `pnpm prisma:push` should create your database tables
- ✅ Your app loading screen should resolve

## 💡 Troubleshooting

If you're still having issues:

1. **Try different connection modes** (pooling vs direct)
2. **Check the region** - your database might be in a different AWS region
3. **Verify the project reference** matches your project
4. **Reset your database password** if authentication fails

The key is getting the exact connection string from your Supabase dashboard rather than guessing the format!
