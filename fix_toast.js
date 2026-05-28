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
  if (!content.includes('import { showToast }')) {
    content = content.replace(/(import .*;\n)/, ' { showToast } from "@/components/Toast";\n');
  }

  // Remove state
  content = content.replace(/const \[toast, setToast\] = useState[^;]+;\n/g, '');

  // Remove local function
  content = content.replace(/const showToast = \(msg: string, type: "success" \| "error" = "success"\) => {[\s\S]*?};\n/g, '');

  // Remove usage of "error" parameter
  content = content.replace(/showToast\(([^,]+),\s*"error"\)/g, 'showToast()');
  content = content.replace(/showToast\(([^,]+),\s*"success"\)/g, 'showToast()');

  // Remove toast render block. It usually starts with {/* Toast */} or {toast.show && (
  content = content.replace(/\{\/\*\s*Toast\s*\*\/\}\s*\{toast\.show && \([\s\S]*?\)\}\n?/g, '');
  content = content.replace(/\{toast\.show && \([\s\S]*?\)\}\n?/g, ''); // Fallback

  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed toast in: ' + file);
});
