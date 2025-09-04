#!/usr/bin/env node

/**
 * Create tables using Supabase client (bypassing Prisma push issues)
 */

require('dotenv').config({ path: '.env.local' });

const createTablesSQL = `
-- CreatorProfile table
CREATE TABLE IF NOT EXISTS "CreatorProfile" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "experienceId" TEXT UNIQUE NOT NULL,
    title TEXT,
    tags JSONB NOT NULL,
    "audienceSize" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ProposalStatus enum
DO $$ BEGIN
    CREATE TYPE "ProposalStatus" AS ENUM ('pending', 'accepted', 'declined', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Proposal table
CREATE TABLE IF NOT EXISTS "Proposal" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,
    status "ProposalStatus" NOT NULL DEFAULT 'pending',
    window TEXT,
    offer TEXT,
    "aiCopy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("fromId") REFERENCES "CreatorProfile"(id),
    FOREIGN KEY ("toId") REFERENCES "CreatorProfile"(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "Proposal_toId_status_createdAt_idx" ON "Proposal"("toId", status, "createdAt");
CREATE INDEX IF NOT EXISTS "Proposal_fromId_status_createdAt_idx" ON "Proposal"("fromId", status, "createdAt");

-- Swap table
CREATE TABLE IF NOT EXISTS "Swap" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "proposalId" TEXT UNIQUE NOT NULL,
    "utmToken" TEXT NOT NULL,
    "autoPost" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("proposalId") REFERENCES "Proposal"(id)
);

-- Enable Row Level Security (recommended for Supabase)
ALTER TABLE "CreatorProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Proposal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Swap" ENABLE ROW LEVEL SECURITY;

-- Create basic policies (adjust as needed for your app)
CREATE POLICY "Enable all for authenticated users" ON "CreatorProfile" FOR ALL USING (true);
CREATE POLICY "Enable all for authenticated users" ON "Proposal" FOR ALL USING (true);
CREATE POLICY "Enable all for authenticated users" ON "Swap" FOR ALL USING (true);
`;

async function createTables() {
  console.log('🔧 Creating database tables via Supabase...\n');
  
  try {
    const { createClient } = require('@supabase/supabase-js');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !serviceKey) {
      console.log('❌ Missing Supabase credentials');
      return false;
    }
    
    const supabase = createClient(supabaseUrl, serviceKey);
    
    console.log('📡 Executing SQL to create tables...');
    
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: createTablesSQL
    });
    
    if (error) {
      console.log('❌ SQL execution failed:', error.message);
      
      // Try alternative method
      console.log('🔄 Trying alternative method...');
      const { data: altData, error: altError } = await supabase
        .from('_dummy')  // This will fail, but might give us better error info
        .select('*');
        
      console.log('Alternative error:', altError?.message);
      return false;
    }
    
    console.log('✅ Database tables created successfully!');
    console.log('📊 Result:', data);
    
    return true;
    
  } catch (error) {
    console.log('❌ Error creating tables:', error.message);
    return false;
  }
}

async function main() {
  console.log('🏗️  Database Table Creation\n');
  console.log('=' .repeat(50));
  
  const success = await createTables();
  
  if (success) {
    console.log('\n🎉 Tables created! Now run:');
    console.log('   pnpm prisma:generate');
    console.log('   pnpm dev');
  } else {
    console.log('\n💡 Try creating tables manually in Supabase dashboard:');
    console.log('   1. Go to Table Editor');
    console.log('   2. Create tables based on your Prisma schema');
    console.log('   3. Then run: pnpm prisma:generate');
  }
}

main().catch(error => {
  console.error('💥 Script error:', error);
  process.exit(1);
});
