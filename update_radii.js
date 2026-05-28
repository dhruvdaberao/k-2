const fs = require('fs');
let file = 'src/components/ProductCardV2.css';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/border-radius:\s*30px;/g, 'border-radius: 12px;');
content = content.replace(/border-radius:\s*30px\s*!important;/g, 'border-radius: 12px !important;');

fs.writeFileSync(file, content, 'utf8');
console.log("Updated ProductCardV2.css radii to 12px!");
