const fs = require('fs');

const files = [
  'src/app/admin/carousels/page.tsx',
  'src/app/admin/carousels/timer/page.tsx',
  'src/app/admin/carousels/[id]/page.tsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');

  // Insert react import after use client
  if (!content.includes('import { useState')) {
    content = content.replace(/"use client";\n/, '"use client";\n\nimport React, { useState, useEffect } from "react";\n');
  }

  fs.writeFileSync(file, content, 'utf8');
  console.log('Restored React import in: ' + file);
});
