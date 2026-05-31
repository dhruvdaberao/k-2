import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdmin } from '@/lib/isAdmin';

export const dynamic = 'force-dynamic';

async function verifyAdmin(request: Request) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return null;

  const supabaseAuth = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
  
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!isAdmin(user)) return null;

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  return supabaseAdmin;
}

export async function POST(request: Request) {
  try {
    const supabaseAdmin = await verifyAdmin(request);
    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { action, payload } = await request.json();

    if (action === 'insert') {
      const { error } = await supabaseAdmin.from('categories').insert(payload);
      if (error) throw error;
    } else if (action === 'update') {
      const { id, data, oldName } = payload;
      const { error } = await supabaseAdmin.from('categories').update(data).eq('id', id);
      if (error) throw error;
      
      if (oldName && oldName !== data.name) {
        await supabaseAdmin.from('products').update({ category: data.name }).eq('category', oldName);
      }
    } else if (action === 'updatePriority') {
      // payload is an array of updates
      await Promise.all(payload.map((u: any) => 
        supabaseAdmin.from('categories').update({ priority: u.priority }).eq('id', u.id)
      ));
    } else {
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Admin Catalog API] POST Category Error:', err);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabaseAdmin = await verifyAdmin(request);
    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const name = searchParams.get('name');
    if (!id || !name) return NextResponse.json({ success: false, error: 'Missing ID or name' }, { status: 400 });

    // Fallback products to 'Bags'
    await supabaseAdmin.from('products').update({ category: 'Bags' }).eq('category', name);

    const { error } = await supabaseAdmin.from('categories').delete().eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Admin Catalog API] DELETE Category Error:', err);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
