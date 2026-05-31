const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');

if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' });
} else {
  dotenv.config();
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !anonKey) {
  console.error("Missing Supabase URL or Anon Key");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, anonKey);

const tables = [
  'products', 'orders', 'order_items', 'profiles', 'cart',
  'reviews', 'categories', 'carousels', 'newsletter', 'contact_messages'
];

async function audit() {
  console.log("=== SUPABASE RLS AUDIT (ANON KEY) ===");
  for (const table of tables) {
    console.log(`\nTesting table: ${table}`);
    
    // Test SELECT
    const { data: readData, error: readError } = await supabase.from(table).select('*').limit(1);
    if (readError) {
      console.log(`- SELECT: 🔴 Denied (${readError.message})`);
    } else {
      console.log(`- SELECT: 🟢 Allowed (Returned ${readData.length} rows)`);
    }
    
    // Test INSERT
    const { error: insertError } = await supabase.from(table).insert([{ id: 'test-id' }]);
    if (insertError) {
      console.log(`- INSERT: 🔴 Denied (${insertError.message})`);
    } else {
      console.log(`- INSERT: 🟢 Allowed (Warning: Anonymous writes allowed!)`);
    }
    
    // Test UPDATE
    const { error: updateError } = await supabase.from(table).update({ test: 'test' }).eq('id', 'test-id');
    if (updateError) {
      console.log(`- UPDATE: 🔴 Denied (${updateError.message})`);
    } else {
      console.log(`- UPDATE: 🟢 Allowed (Warning: Anonymous updates allowed!)`);
    }
    
    // Test DELETE
    const { error: deleteError } = await supabase.from(table).delete().eq('id', 'test-id');
    if (deleteError) {
      console.log(`- DELETE: 🔴 Denied (${deleteError.message})`);
    } else {
      console.log(`- DELETE: 🟢 Allowed (Warning: Anonymous deletes allowed!)`);
    }
  }
}

audit().catch(console.error);
