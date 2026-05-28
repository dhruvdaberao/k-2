const fs = require('fs');

const files = [
  'src/app/admin/categories/page.tsx',
  'src/app/admin/orders/page.tsx',
  'src/app/admin/orders/[id]/page.tsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');

  // Categories table card
  content = content.replace(/<div className="bg-\[#F5EFE6\] rounded-\[24px\] border border-\[#E6DCCF\] shadow-sm mb-4 md:mb-8">/g, '<div className="mb-4 md:mb-8">');
  content = content.replace(/<div className="bg-\[#F5EFE6\] rounded-\[24px\] border border-\[#E6DCCF\] shadow-sm" style={{ overflow: 'hidden' }}>/g, '<div className="">');
  content = content.replace(/className="max-w-md mx-auto space-y-4 md:space-y-8 bg-\[#F5EFE6\] rounded-\[24px\] border border-\[#E6DCCF\] p-4 md:p-6 shadow-sm"/g, 'className="max-w-md mx-auto space-y-4 md:space-y-8"');

  // Orders table card
  content = content.replace(/<div className="bg-\[#F5EFE6\] rounded-\[24px\] border border-\[#E6DCCF\] shadow-sm overflow-hidden mb-4 md:mb-8">/g, '<div className="mb-4 md:mb-8">');
  
  // Orders [id] form card
  content = content.replace(/className="bg-\[#F5EFE6\] rounded-\[24px\] border border-\[#E6DCCF\] shadow-sm p-4 md:p-6"/g, 'className=""');
  
  fs.writeFileSync(file, content, 'utf8');
  console.log('Updated: ' + file);
});
