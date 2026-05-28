const fs = require('fs');
const file = 'src/app/admin/carousels/[id]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace any class containing bg-[#F5EFE6] rounded-[24px] inside the form tag or main wrapper
content = content.replace(/className="max-w-2xl mx-auto space-y-4 md:space-y-8 bg-\[#F5EFE6\] rounded-\[24px\] border border-\[#E6DCCF\] shadow-sm"/g, 'className="max-w-2xl mx-auto space-y-4 md:space-y-8"');

content = content.replace(/className="max-w-4xl mx-auto space-y-4 md:space-y-8 bg-\[#F5EFE6\] rounded-\[24px\] border border-\[#E6DCCF\] shadow-sm"/g, 'className="max-w-4xl mx-auto space-y-4 md:space-y-8"');

content = content.replace(/className="space-y-4 md:space-y-8 bg-\[#F5EFE6\] rounded-\[24px\] border border-\[#E6DCCF\] shadow-sm"/g, 'className="space-y-4 md:space-y-8"');

fs.writeFileSync(file, content, 'utf8');
console.log(content.includes('bg-[#F5EFE6] rounded-[24px]'));
