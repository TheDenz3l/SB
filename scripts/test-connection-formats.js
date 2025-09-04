#!/usr/bin/env node

/**
 * Test different PostgreSQL connection string formats
 */

require('dotenv').config({ path: '.env.local' });

async function testConnectionFormats() {
  console.log('🔍 Testing different connection string formats...\n');
  
  const { Client } = require('pg');
  
  // Extract parts from current DATABASE_URL
  const currentUrl = process.env.DATABASE_URL;
  console.log('Current DATABASE_URL:', currentUrl);
  
  if (!currentUrl) {
    console.log('❌ No DATABASE_URL found');
    return;
  }
  
  // Parse the URL
  const urlMatch = currentUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  
  if (!urlMatch) {
    console.log('❌ Could not parse DATABASE_URL');
    return;
  }
  
  const [, username, password, host, port, database] = urlMatch;
  
  console.log('Parsed connection details:');
  console.log(`  Username: ${username}`);
  console.log(`  Password: ${password.substring(0, 4)}...`);
  console.log(`  Host: ${host}`);
  console.log(`  Port: ${port}`);
  console.log(`  Database: ${database}\n`);
  
  // Try different formats
  const formats = [
    {
      name: 'Original format',
      url: currentUrl
    },
    {
      name: 'With SSL mode require',
      url: `${currentUrl}?sslmode=require`
    },
    {
      name: 'With connection limit',
      url: `${currentUrl}?sslmode=require&connection_limit=1`
    },
    {
      name: 'Direct connection (bypassing pooler)',
      url: currentUrl.replace(`:${port}/`, ':5432/').replace('db.', 'db.').replace('.supabase.co', '.supabase.co')
    }
  ];
  
  // Test each format
  for (const format of formats) {
    console.log(`🔄 Testing: ${format.name}`);
    console.log(`   URL: ${format.url.replace(password, '***')}`);
    
    try {
      const client = new Client({
        connectionString: format.url,
        connectionTimeoutMillis: 5000, // 5 second timeout
      });
      
      await client.connect();
      console.log('✅ Connection successful!');
      
      const result = await client.query('SELECT NOW()');
      console.log(`📊 Current time: ${result.rows[0].now}\n`);
      
      await client.end();
      
      // If this format works, update the .env file
      console.log(`🎉 Working connection string found!`);
      console.log(`💡 Consider updating your .env files with this format:\n`);
      console.log(`DATABASE_URL="${format.url}"\n`);
      
      return format.url;
      
    } catch (error) {
      console.log(`❌ Failed: ${error.message}\n`);
    }
  }
  
  console.log('💡 None of the standard formats worked. Try these additional steps:');
  console.log('   1. Verify your database password in Supabase Dashboard > Settings > Database');
  console.log('   2. Check if IPv6 is causing issues (try using IPv4 DNS)');
  console.log('   3. Test connection from a different network');
  console.log('   4. Contact Supabase support if the project is definitely running');
  
  return null;
}

testConnectionFormats().catch(error => {
  console.error('💥 Test script error:', error);
  process.exit(1);
});
