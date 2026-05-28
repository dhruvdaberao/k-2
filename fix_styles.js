const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts')) results.push(file);
    }
  });
  return results;
}

const files = walk('./src');
let changedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Fix broken spacing from previous script
  content = content.replace(/bg-\[#F5EFE6\]-\[24px\]/g, 'bg-[#F5EFE6] rounded-[24px]');
  content = content.replace(/rounded-\[24px\]bg-\[#F5EFE6\]/g, 'rounded-[24px] bg-[#F5EFE6]');
  
  // Specific fix for admin/carousels/page.tsx buttons with inline styles
  if (file.includes('carousels') && file.endsWith('page.tsx')) {
    // Replace "Edit Auto-Play Timer" inline button
    content = content.replace(
      /className="text-sm font-bold transition-transform active:scale-95 flex items-center justify-center text-white hover:text-white"[\s\n]*style={{ background: '#4A3219', color: '#ffffff', padding: '12px 24px', borderRadius: '8px', border: 'none', boxShadow: '0 2px 4px rgba\(0,0,0,0\.1\)', textDecoration: 'none' }}/g,
      'className="btn-primary text-sm font-bold transition-transform active:scale-95 flex items-center justify-center"'
    );
    // Replace "+ Add New Slide" inline button
    content = content.replace(
      /className="text-sm font-bold transition-transform active:scale-95 flex items-center justify-center text-white hover:text-white"[\s\n]*style={{ background: '#4A3219', color: '#ffffff', padding: '12px 24px', borderRadius: '8px', border: 'none', boxShadow: '0 2px 4px rgba\(0,0,0,0\.1\)', textDecoration: 'none' }}/g,
      'className="btn-primary text-sm font-bold transition-transform active:scale-95 flex items-center justify-center"'
    );
    // Replace "Edit" inline button in table
    content = content.replace(
      /className="text-sm font-bold transition-transform active:scale-95 flex items-center justify-center text-white hover:text-white"[\s\n]*style={{ background: '#4A3219', color: '#ffffff', padding: '8px 16px', borderRadius: '8px', border: 'none', textDecoration: 'none' }}/g,
      'className="btn-primary text-sm font-bold transition-transform active:scale-95 flex items-center justify-center px-4 py-2"'
    );
  }

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    changedCount++;
    console.log('Fixed: ' + file);
  }
});

console.log('Total files fixed: ' + changedCount);
