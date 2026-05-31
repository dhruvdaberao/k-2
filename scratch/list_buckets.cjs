const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkBuckets() {
  const { data, error } = await supabase.storage.listBuckets();
  if (error) {
    console.error('Error fetching buckets:', error);
    return;
  }
  
  console.log('--- BUCKETS ---');
  for (const bucket of data) {
    console.log(`\nName: ${bucket.name}`);
    console.log(`Public: ${bucket.public}`);
    console.log(`Allowed MIME types: ${bucket.allowed_mime_types?.join(', ')}`);
    console.log(`File size limit: ${bucket.file_size_limit}`);
    
    // Check files inside
    const { data: files } = await supabase.storage.from(bucket.name).list();
    if (files && files.length > 0) {
      console.log(`Sample files: ${files.slice(0, 3).map(f => f.name).join(', ')} (Total: ${files.length})`);
    } else {
      console.log('No files found.');
    }
  }
}

checkBuckets();
