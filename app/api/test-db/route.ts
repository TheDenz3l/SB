import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // Test database connection
    await prisma.$connect();
    
    // Try a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    
    await prisma.$disconnect();
    
    return NextResponse.json({ 
      ok: true, 
      message: "Database connection successful!",
      result: result 
    });
    
  } catch (error: any) {
    console.error("Database connection error:", error);
    
    return NextResponse.json({ 
      ok: false, 
      error: error.message,
      details: "Check server logs for full error details"
    }, { status: 500 });
  }
}
