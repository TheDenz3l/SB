#!/usr/bin/env node

/**
 * Database connection test script
 * Tests both Supabase client and direct PostgreSQL connection
 */

require('dotenv').config({ path: '.env.local' });

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...\n');
  
  try {
    const { createClient } = require('@supabase/supabase-js');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !anonKey) {
      console.log('❌ Missing Supabase credentials');
      return false;
    }
    
    console.log(`📡 Connecting to: ${supabaseUrl}`);
    
    // Test with anon key first
    console.log('🔑 Testing with anon key...');
    const supabaseAnon = createClient(supabaseUrl, anonKey);
    
    // Simple test - try to query a table (will fail but connection should work)
    const { data: anonData, error: anonError } = await supabaseAnon
      .from('_dummy_table_that_does_not_exist')
      .select('*')
      .limit(1);
    
    if (anonError && !anonError.message.includes('does not exist')) {
      console.log('❌ Anon key connection failed:', anonError.message);
    } else {
      console.log('✅ Anon key connection successful!');
    }
    
    // Test with service key if available
    if (serviceKey) {
      console.log('🔑 Testing with service role key...');
      const supabaseService = createClient(supabaseUrl, serviceKey);
      
      const { data: serviceData, error: serviceError } = await supabaseService
        .from('_dummy_table_that_does_not_exist')
        .select('*')
        .limit(1);
      
      if (serviceError && !serviceError.message.includes('does not exist')) {
        console.log('❌ Service key connection failed:', serviceError.message);
        return false;
      } else {
        console.log('✅ Service key connection successful!');
        return true;
      }
    }
    
    return true;
    
  } catch (error) {
    console.log('❌ Supabase connection error:', error.message);
    return false;
  }
}

async function testPostgreSQLConnection() {
  console.log('\n🐘 Testing direct PostgreSQL connection...\n');
  
  try {
    const { Client } = require('pg');
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      console.log('❌ Missing DATABASE_URL');
      return false;
    }
    
    console.log('📡 Connecting with Prisma DATABASE_URL...');
    
    const client = new Client({
      connectionString: databaseUrl,
    });
    
    await client.connect();
    console.log('✅ PostgreSQL connection successful!');
    
    const result = await client.query('SELECT version()');
    console.log('📊 PostgreSQL version:', result.rows[0].version.substring(0, 50) + '...');
    
    await client.end();
    return true;
    
  } catch (error) {
    console.log('❌ PostgreSQL connection failed:', error.message);
    
    if (error.message.includes('ENOTFOUND') || error.message.includes("Can't reach")) {
      console.log('\n💡 Possible solutions:');
      console.log('   1. Check if your Supabase project is paused (unpause it in dashboard)');
      console.log('   2. Verify the database URL format in your .env files');
      console.log('   3. Check if you\'re behind a firewall blocking port 5432');
      console.log('   4. Ensure your database password is correct');
    }
    
    return false;
  }
}

async function main() {
  console.log('🔌 Database Connection Test\n');
  console.log('=' .repeat(50));
  
  const supabaseOk = await testSupabaseConnection();
  const pgOk = await testPostgreSQLConnection();
  
  console.log('\n' + '=' .repeat(50));
  
  if (supabaseOk && pgOk) {
    console.log('🎉 All database connections working!');
    console.log('🚀 You can now run: pnpm prisma:push');
    process.exit(0);
  } else {
    console.log('⚠️  Database connection issues detected');
    console.log('📖 Check your Supabase project dashboard and credentials');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('💥 Test script error:', error);
  process.exit(1);
});
