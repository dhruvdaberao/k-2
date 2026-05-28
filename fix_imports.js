const fs = require('fs');

const files = [
  'src/app/admin/carousels/page.tsx',
  'src/app/admin/carousels/timer/page.tsx',
  'src/app/admin/carousels/[id]/page.tsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');

  // Fix the broken import
  content = content.replace(/ \{ showToast \} from "@\/components\/Toast";\n/, 'import { showToast } from "@/components/Toast";\n');
  
  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed imports in: ' + file);
});
