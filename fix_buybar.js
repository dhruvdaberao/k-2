const fs = require('fs');
const file = 'src/components/BuyBar.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace any borderRadius: "12px" or border-radius: 14px with 30px
content = content.replace(/borderRadius:\s*"12px"/g, 'borderRadius: "30px"');
content = content.replace(/border-radius:\s*14px/g, 'border-radius: 30px');

fs.writeFileSync(file, content, 'utf8');
console.log("Updated BuyBar.tsx pill shapes!");
