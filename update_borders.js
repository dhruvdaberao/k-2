const fs = require('fs');

function updateBorders(file) {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  // Replace border-[#E6DCCF] with border-[#C4A484] for input fields
  content = content.replace(/border-\[#E6DCCF\]/g, 'border-[#C4A484]');
  fs.writeFileSync(file, content, 'utf8');
  console.log('Updated borders in ' + file);
}

updateBorders('src/app/admin/products/ProductForm.tsx');
updateBorders('src/app/admin/carousels/CarouselForm.tsx');
updateBorders('src/app/admin/carousels/[id]/page.tsx'); // Just in case
