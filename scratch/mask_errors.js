const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('./src/app/api', function(filePath) {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    // Replace: error: err.message -> error: 'Internal Server Error'
    content = content.replace(/error:\s*err\.message/g, "error: 'Internal Server Error'");
    content = content.replace(/error:\s*error\.message/g, "error: 'Internal Server Error'");
    // Replace: error: error.message || ... -> error: 'Internal Server Error'
    content = content.replace(/error:\s*error\.message\s*\|\|[^,}]+/g, "error: 'Internal Server Error'");
    content = content.replace(/error:\s*err\.message\s*\|\|[^,}]+/g, "error: 'Internal Server Error'");
    // Same for insertError.message, etc.
    content = content.replace(/error:\s*[a-zA-Z0-9_]+Error\.message/g, "error: 'Internal Server Error'");
    
    // For invoice API: return new Response("Error generating invoice: " + err.message
    content = content.replace(/"Error generating invoice: "\s*\+\s*err\.message/g, '"Error generating invoice. Internal Server Error."');
    
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Fixed', filePath);
    }
  }
});
