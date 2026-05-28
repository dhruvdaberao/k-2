const fs = require('fs');
let file = 'src/app/globals.css';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/--btn-radius:\s*20px;/g, '--btn-radius: 12px;');

fs.writeFileSync(file, content, 'utf8');
console.log("Updated globals.css btn-radius to 12px!");
