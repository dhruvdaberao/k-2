const fs = require('fs');

const files = [
  'src/app/admin/carousels/page.tsx',
  'src/app/admin/carousels/timer/page.tsx',
  'src/app/admin/carousels/[id]/page.tsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');

  // Add import if not present
  if (!content.includes('import { showToast } from "@/components/Toast"')) {
    content = content.replace(/(import .*;\n)/, 'import { showToast } from "@/components/Toast";\n$1');
  }

  // Remove state
  content = content.replace(/const \[toast, setToast\] = useState[^;]+;\n/g, '');

  // Remove local function
  content = content.replace(/const showToast = \(msg: string, type: "success" \| "error" = "success"\) => {[\s\S]*?};\n/g, '');

  // Fix usages
  content = content.replace(/showToast\(([^,]+),\s*"error"\)/g, 'showToast($1)');
  content = content.replace(/showToast\(([^,]+),\s*"success"\)/g, 'showToast($1)');

  // Remove toast block at the end (match from {/* Toast */} to the end div before </main>)
  content = content.replace(/\{\/\*\s*Toast\s*\*\/\}\s*\{toast\.show && \([\s\S]*?\)\}\n?/g, '');
  content = content.replace(/\{toast\.show && \([\s\S]*?\)\}\n?/g, ''); 

  fs.writeFileSync(file, content, 'utf8');
  console.log('Successfully updated: ' + file);
});
