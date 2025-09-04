#!/usr/bin/env node

/**
 * Environment validation script
 * Run with: node scripts/validate-env.js
 */

require('dotenv').config({ path: '.env.local' });

const requiredEnvVars = {
  // Whop Configuration
  'WHOP_API_KEY': 'Whop API key for server-side operations',
  'NEXT_PUBLIC_WHOP_APP_ID': 'Your Whop app ID',
  
  // Supabase Configuration
  'NEXT_PUBLIC_SUPABASE_URL': 'Your Supabase project URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'Supabase anonymous/public key',
  'SUPABASE_SERVICE_ROLE_KEY': 'Supabase service role key (admin)',
  'DATABASE_URL': 'PostgreSQL connection string for Prisma'
};

const optionalEnvVars = {
  'NEXT_PUBLIC_WHOP_PARENT_ORIGIN': 'Parent origin for development embeds',
  'WHOP_WEBHOOK_SECRET': 'Secret for webhook signature verification',
  'IP_HASH_SALT': 'Salt for IP address hashing',
  'CRON_SECRET': 'Secret for cron job authentication'
};

console.log('🔍 Validating environment configuration...\n');

let hasErrors = false;
let hasWarnings = false;

// Check required variables
console.log('✅ Required Variables:');
for (const [key, description] of Object.entries(requiredEnvVars)) {
  const value = process.env[key];
  if (!value) {
    console.log(`❌ ${key}: MISSING - ${description}`);
    hasErrors = true;
  } else if (value.includes('your-') || value.includes('replace-')) {
    console.log(`⚠️  ${key}: PLACEHOLDER - ${description}`);
    hasWarnings = true;
  } else {
    console.log(`✅ ${key}: OK`);
  }
}

// Check optional variables
console.log('\n📋 Optional Variables:');
for (const [key, description] of Object.entries(optionalEnvVars)) {
  const value = process.env[key];
  if (!value) {
    console.log(`ℹ️  ${key}: Not set - ${description}`);
  } else {
    console.log(`✅ ${key}: OK`);
  }
}

// Validate Supabase URL format
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (supabaseUrl && !supabaseUrl.match(/^https:\/\/[a-z0-9]+\.supabase\.co$/)) {
  console.log('\n⚠️  NEXT_PUBLIC_SUPABASE_URL format looks incorrect');
  console.log('   Expected: https://your-project-ref.supabase.co');
  hasWarnings = true;
}

// Validate Database URL format
const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl && !databaseUrl.startsWith('postgresql://')) {
  console.log('\n⚠️  DATABASE_URL should be a PostgreSQL connection string');
  console.log('   Expected: postgresql://postgres:password@host:5432/postgres');
  hasWarnings = true;
}

console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ Configuration has errors - please fix the missing variables');
  console.log('📖 See SUPABASE_SETUP.md for detailed setup instructions');
  process.exit(1);
} else if (hasWarnings) {
  console.log('⚠️  Configuration has warnings - please check placeholder values');
  console.log('📖 See SUPABASE_SETUP.md for detailed setup instructions');
  process.exit(0);
} else {
  console.log('✅ All environment variables are properly configured!');
  console.log('🚀 You can now run: pnpm prisma:push');
  process.exit(0);
}
