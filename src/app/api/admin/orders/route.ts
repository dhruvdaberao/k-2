import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Verify the requester is the admin
    const supabaseAuth = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabaseAuth.auth.getUser();

    if (!user || user.email !== 'keshvicrafts@gmail.com') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
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
