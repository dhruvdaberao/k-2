const fs = require('fs');

const files = [
  'src/app/admin/products/ProductForm.tsx',
  'src/app/admin/products/page.tsx',
  'src/app/admin/carousels/page.tsx',
  'src/app/admin/carousels/[id]/page.tsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');

  // In ProductForm:
  content = content.replace(/className="space-y-4 md:space-y-8 bg-\[#F5EFE6\] rounded-\[24px\] border border-\[#E6DCCF\] shadow-sm"/, 'className="space-y-4 md:space-y-8"');

  // In Carousels [id] page:
  content = content.replace(/className="space-y-4 md:space-y-8 bg-\[#F5EFE6\] rounded-\[24px\] border border-\[#E6DCCF\] shadow-sm"/, 'className="space-y-4 md:space-y-8"');
  
  // Also check if there's any other bg-[#F5EFE6] rounded-[24px] in forms
  content = content.replace(/className="max-w-2xl mx-auto space-y-4 md:space-y-8 bg-\[#F5EFE6\] rounded-\[24px\] border border-\[#E6DCCF\] shadow-sm"/, 'className="max-w-2xl mx-auto space-y-4 md:space-y-8"');

  // In Products page table card and Carousels page table card
  content = content.replace(/<div className="bg-\[#F5EFE6\] rounded-\[24px\] border border-\[#E6DCCF\] shadow-sm overflow-hidden">/g, '<div className="">');
  content = content.replace(/<div className="bg-\[#F5EFE6\] rounded-\[24px\] border border-\[#E6DCCF\] overflow-hidden shadow-sm">/g, '<div className="">');

  fs.writeFileSync(file, content, 'utf8');
  console.log('Updated: ' + file);
});
