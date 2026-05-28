const fs = require('fs');
const file = 'src/app/globals.css';
let content = fs.readFileSync(file, 'utf8');

// Find and replace all "border-radius: 8px" or "12px" for buttons
content = content.replace(/border-radius:\s*8px;/g, 'border-radius: 20px;');
content = content.replace(/--btn-radius:\s*8px;/g, '--btn-radius: 20px;');

// Also fix plp-card-mobile btn-primary rules
content = content.replace(/\.plp-card \.btn-primary,\s*\.plp-card-mobile \.btn-primary[\s\S]*?border-radius:\s*8px\s*!important;/g, '');

fs.writeFileSync(file, content, 'utf8');
console.log("Updated globals.css");
