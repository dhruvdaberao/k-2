const fs = require('fs');
const file = 'src/app/admin/carousels/[id]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/className="bg-\[#F5EFE6\] rounded-\[24px\] border border-\[#E6DCCF\] p-4 md:p-6 shadow-sm"/g, 'className=""');

fs.writeFileSync(file, content, 'utf8');
console.log("Fixed carousel form!");
