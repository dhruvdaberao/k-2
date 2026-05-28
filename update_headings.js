const fs = require('fs');

function updateHeading(file) {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/text-xl md:text-3xl font-bold/g, 'text-2xl md:text-4xl font-bold');
  fs.writeFileSync(file, content, 'utf8');
  console.log('Updated heading in ' + file);
}

updateHeading('src/app/admin/products/new/page.tsx');
updateHeading('src/app/admin/products/[id]/edit/page.tsx');
updateHeading('src/app/admin/carousels/new/page.tsx');
updateHeading('src/app/admin/carousels/[id]/page.tsx');
