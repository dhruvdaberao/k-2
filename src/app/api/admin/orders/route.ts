import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { isAdmin } from '@/lib/isAdmin';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    cookies(); // Force dynamic rendering and opt out of Next.js static caching
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized - No Token' }, { status: 401 });
    }

    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );
    
    const { data: { user } } = await supabaseAuth.auth.getUser();

    if (!isAdmin(user)) {
      return NextResponse.json({ success: false, error: 'Unauthorized - Not Admin' }, { status: 401 });
    }

    // 2. Use service role to bypass RLS and fetch ALL orders
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select('id, display_id, email, status, total_amount, created_at, payment_method')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Admin Orders API] Error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, orders: orders || [] });
  } catch (err: any) {
    console.error('[Admin Orders API] Critical:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
