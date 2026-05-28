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

  // Replace bg-white with bg-[#F5EFE6] and rounded-2xl/xl with rounded-[24px] for main cards
  // We'll specifically target combinations to avoid hitting inputs as much as possible
  
  // Pattern 1: bg-white followed by padding and rounded-2xl
  content = content.replace(/bg-white([^\"\}]+)rounded-2xl/g, 'bg-[#F5EFE6]-[24px]');
  
  // Pattern 2: rounded-2xl followed by bg-white
  content = content.replace(/rounded-2xl([^\"\}]+)bg-white/g, 'rounded-[24px]-[#F5EFE6]');

  // Pattern 3: bg-white rounded-xl shadow-sm border (like orders card)
  content = content.replace(/bg-white rounded-xl shadow-sm border/g, 'bg-[#F5EFE6] rounded-[24px] shadow-sm border');

  // Pattern 4: profile auth card
  content = content.replace(/bg-white rounded-2xl p-8/g, 'bg-[#F5EFE6] rounded-[24px] p-8');

  // Contact cards
  content = content.replace(/bg-white p-6 rounded-xl border border-\[#eadfcd\]/g, 'bg-[#F5EFE6] p-6 rounded-[24px] border border-[#eadfcd]');

  // Cart / Checkout empty state
  content = content.replace(/bg-white p-8/g, 'bg-[#F5EFE6] p-8');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    changedCount++;
    console.log('Updated: ' + file);
  }
});

console.log('Total files updated: ' + changedCount);
