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
    
    // Test if anyone can read profiles by using the ANON key
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const anonSupabase = createClient(supabaseUrl, anonKey);
    const { data: profiles, error: profileError } = await anonSupabase.from('profiles').select('*').limit(5);

    return NextResponse.json({ 
        profilesLeaked: profiles,
        profileError
    });
}
