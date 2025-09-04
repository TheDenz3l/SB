#!/usr/bin/env node

/**
 * Simple Prisma connection test
 */

require('dotenv').config({ path: '.env.local' });

async function testPrismaConnection() {
  console.log('🔍 Testing Prisma client connection...\n');
  
  try {
    const { PrismaClient } = require('@prisma/client');
    
    const prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });
    
    console.log('📡 Connecting to database...');
    
    // Simple query to test connection
    await prisma.$connect();
    console.log('✅ Prisma connection successful!');
    
    // Try a simple raw query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('📊 Test query result:', result);
    
    await prisma.$disconnect();
    console.log('🎉 All tests passed!');
    
    return true;
    
  } catch (error) {
    console.log('❌ Prisma connection failed:', error.message);
    
    if (error.message.includes('timeout')) {
      console.log('\n💡 This looks like a timeout issue.');
      console.log('   Try using a direct connection instead of pooler.');
    }
    
    return false;
  }
}

testPrismaConnection().catch(error => {
  console.error('💥 Test script error:', error);
  process.exit(1);
});
