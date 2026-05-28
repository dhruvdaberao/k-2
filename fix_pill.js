const fs = require('fs');
const file = 'src/components/ProductCardV2.css';
let content = fs.readFileSync(file, 'utf8');

// Replace border-radius in interactive-qty-pill and add-to-cart-overlay
content = content.replace(/\.interactive-qty-pill\s*\{[^}]*border-radius:\s*\d+px;[^}]*\}/g, match => match.replace(/border-radius:\s*\d+px;/, 'border-radius: 30px;'));
content = content.replace(/\.add-to-cart-overlay\s*\{[^}]*border-radius:\s*\d+px;[^}]*\}/g, match => match.replace(/border-radius:\s*\d+px;/, 'border-radius: 30px;'));

// Also handle the media query ones
content = content.replace(/\.interactive-qty-pill\s*\{[^}]*border-radius:\s*10px;[^}]*\}/g, match => match.replace(/border-radius:\s*10px;/, 'border-radius: 30px;'));
content = content.replace(/\.add-to-cart-overlay\s*\{[^}]*border-radius:\s*10px;[^}]*\}/g, match => match.replace(/border-radius:\s*10px;/, 'border-radius: 30px;'));

// Just to be safe, find any 10px or 12px border radius in this section and make it 30px
let lines = content.split('\n');
let inPillSection = false;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('/* --- INTERACTIVE QTY PILL --- */')) inPillSection = true;
  if (inPillSection && lines[i].includes('border-radius: 12px;')) {
    lines[i] = lines[i].replace('border-radius: 12px;', 'border-radius: 30px;');
  }
  if (inPillSection && lines[i].includes('border-radius: 10px;')) {
    lines[i] = lines[i].replace('border-radius: 10px;', 'border-radius: 30px;');
  }
}

fs.writeFileSync(file, lines.join('\n'), 'utf8');
console.log("Updated ProductCardV2.css pill shapes!");
