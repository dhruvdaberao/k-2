import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Only initialize Ratelimit if Redis URL/Token are available
const hasRedis = !!(
  process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
);

let ratelimit: Ratelimit | null = null;

if (hasRedis) {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '',
    token: process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '',
  });

  ratelimit = new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(60, '1 m'), // 60 requests per minute
    analytics: false,
    ephemeralCache: new Map(), // Use a local cache for faster Edge execution
  });
}

export async function middleware(request: NextRequest) {
  // If Redis is not configured, bypass rate limiting
  if (!ratelimit) {
    return NextResponse.next();
  }

  const ip = request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1';

  try {
    const { success, limit, reset, remaining } = await ratelimit.limit(`global_api_ratelimit_${ip}`);
    
    if (!success) {
      return new NextResponse(
        JSON.stringify({ success: false, error: 'Too Many Requests' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString()
          }
        }
      );
    }
  } catch (err) {
    console.error('Middleware Rate Limiting Error:', err);
    // Fail-open: if Redis is down, don't break the app
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Apply rate limiting to all /api/* routes except webhooks if necessary
    '/api/:path*',
  ],
};
