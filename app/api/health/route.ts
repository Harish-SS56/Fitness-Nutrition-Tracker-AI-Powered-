import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Basic health check
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: 'checking...',
        email: 'checking...'
      }
    };

    // Test database connection
    try {
      const { neon } = await import('@neondatabase/serverless');
      const sql = neon(process.env.DATABASE_URL!);
      await sql`SELECT 1`;
      healthCheck.services.database = 'healthy';
    } catch (error) {
      healthCheck.services.database = 'unhealthy';
      healthCheck.status = 'degraded';
    }

    // Test email service (basic check)
    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        healthCheck.services.email = 'configured';
      } else {
        healthCheck.services.email = 'not configured';
      }
    } catch (error) {
      healthCheck.services.email = 'error';
    }

    return NextResponse.json(healthCheck, { 
      status: healthCheck.status === 'healthy' ? 200 : 503 
    });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      }, 
      { status: 503 }
    );
  }
}
