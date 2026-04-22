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
    if (filePath.includes('supabaseClient.ts')) return;

    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Detect if we need to replace auth-helpers client hooks
    let hasNextjsClient = content.includes('createClientComponentClient');
    let hasReactClient = content.includes('useSupabaseClient');
    
    if (hasNextjsClient || hasReactClient) {
      changed = true;
      
      // Remove old imports
      content = content.replace(/import\s+\{\s*createClientComponentClient\s*\}\s+from\s+["']@supabase\/auth-helpers-nextjs["'];?\n?/g, '');
      content = content.replace(/import\s+\{\s*useSupabaseClient\s*\}\s+from\s+["']@supabase\/auth-helpers-react["'];?\n?/g, '');
      
      // Remove client instantiations
      content = content.replace(/const\s+supabase\s*=\s*createClientComponentClient\(\);?\n?/g, '');
      content = content.replace(/const\s+supabase\s*=\s*useSupabaseClient\(\);?\n?/g, '');

      // Add the singleton import if not exists
      if (!content.includes('import { supabase } from "@/lib/supabaseClient";')) {
        // Insert after 'use client' or at top
        if (content.includes('"use client";')) {
          content = content.replace('"use client";', '"use client";\n\nimport { supabase } from "@/lib/supabaseClient";');
        } else {
          content = 'import { supabase } from "@/lib/supabaseClient";\n' + content;
        }
      }
    }

    if (changed) {
      fs.writeFileSync(filePath, content);
      console.log('Updated ' + filePath);
    }
  }
});
