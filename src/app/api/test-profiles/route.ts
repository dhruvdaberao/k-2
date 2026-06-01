import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!supabaseUrl || !serviceKey) {
        return NextResponse.json({ error: 'Missing credentials' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    
    // Check what happens when we select from orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, display_id, email, status, total_amount, created_at, payment_method')
      .order('created_at', { ascending: false })
      .limit(1);

    return NextResponse.json({ 
        orders,
        ordersError
    });
}
