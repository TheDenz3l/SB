import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const { getPrisma } = await import("@/lib/db-dynamic");
  const prisma = await getPrisma();
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
