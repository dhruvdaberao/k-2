const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

walkDir('src', function(filePath) {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    if (content.includes('createClientComponentClient') && !filePath.includes('SupabaseProvider.tsx') && !filePath.includes('placeOrder.ts')) {
      content = content.replace(/import\s+\{\s*createClientComponentClient\s*\}\s+from\s+["']@supabase\/auth-helpers-nextjs["'];/g, 'import { useSupabaseClient } from "@supabase/auth-helpers-react";');
      content = content.replace(/const\s+supabase\s*=\s*createClientComponentClient\(\);/g, 'const supabase = useSupabaseClient();');
      changed = true;
    }

    if (changed) {
      fs.writeFileSync(filePath, content);
      console.log('Updated ' + filePath);
    }
  }
});
