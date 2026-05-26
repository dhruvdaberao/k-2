const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getAllBucketFiles(bucket, path = '') {
  const { data, error } = await supabase.storage.from(bucket).list(path, { limit: 1000 });
  if (error) {
    console.error("Error listing files at path", path, error);
    return [];
  }
  
  let files = [];
  for (const item of data) {
    if (item.id === null) {
      // It's a folder
      const subFiles = await getAllBucketFiles(bucket, path ? `${path}/${item.name}` : item.name);
      files.push(...subFiles);
    } else {
      // It's a file
      if (item.name !== '.emptyFolderPlaceholder') {
        files.push(path ? `${path}/${item.name}` : item.name);
      }
    }
  }
  return files;
}

async function runCleanup() {
  console.log("Fetching all products...");
  const { data: products, error } = await supabase.from('products').select('images, variants');
  if (error) {
    console.error("Error fetching products:", error);
    process.exit(1);
  }

  const inUseUrls = new Set();

  products.forEach(p => {
    if (p.images) {
      p.images.forEach(url => inUseUrls.add(url));
    }
    if (p.variants) {
      p.variants.forEach(v => {
        if (v.images) {
          v.images.forEach(url => inUseUrls.add(url));
        }
      });
    }
  });

  const inUsePaths = new Set(Array.from(inUseUrls).map(url => {
    const parts = url.split('product-images/');
    return parts.length === 2 ? parts[1] : null;
  }).filter(Boolean));

  console.log(`Found ${inUsePaths.size} images currently in use by products.`);

  console.log("Fetching all files from product-images bucket...");
  const bucketFiles = await getAllBucketFiles('product-images');
  console.log(`Found ${bucketFiles.length} total files in the bucket.`);

  const orphanedFiles = bucketFiles.filter(file => !inUsePaths.has(file));

  if (orphanedFiles.length === 0) {
    console.log("No orphaned files found! Your storage is clean.");
    return;
  }

  console.log(`Found ${orphanedFiles.length} orphaned files to delete.`);
  console.log(orphanedFiles);

  console.log("Deleting orphaned files...");
  
  // Delete in batches of 100
  for (let i = 0; i < orphanedFiles.length; i += 100) {
    const batch = orphanedFiles.slice(i, i + 100);
    const { data, error: deleteError } = await supabase.storage.from('product-images').remove(batch);
    if (deleteError) {
      console.error("Error deleting batch:", deleteError);
    } else {
      console.log(`Deleted batch of ${data.length} files.`);
    }
  }

  console.log("Cleanup complete!");
}

runCleanup();
