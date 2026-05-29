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
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('c:/Users/dhruv/OneDrive/Desktop/keshvicrafts-2/src');
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let changed = false;

  const replacements = [
    { from: />Cart</g, to: ">Bag<" },
    { from: /title="Cart"/g, to: 'title="Bag"' },
    { from: /"Add to Cart"/g, to: '"Add to Bag"' },
    { from: /'Add to Cart'/g, to: "'Add to Bag'" },
    { from: />Add to Cart</g, to: ">Add to Bag<" },
    { from: /Your cart is empty/g, to: "Your bag is empty" },
    { from: /Buy \/ Add to Cart/g, to: "Buy / Add to Bag" },
    { from: /"Go to Cart"/g, to: '"Go to Bag"' },
    { from: /"Back to Cart"/g, to: '"Back to Bag"' },
    { from: />Back to Cart</g, to: ">Back to Bag<" },
    { from: /No, Add to Cart/g, to: "No, Add to Bag" },
    { from: /Added to Cart/g, to: "Added to Bag" },
    { from: /Cart cleared successfully/g, to: "Bag cleared successfully" },
    { from: /Cart product fetch error/g, to: "Bag product fetch error" },
    { from: /Out of Stock Items in Cart/g, to: "Out of Stock Items in Bag" },
    { from: /in your cart/g, to: "in your bag" },
    { from: /View Cart/g, to: "View Bag" },
    { from: />View Cart</g, to: ">View Bag<" },
  ];

  replacements.forEach(r => {
    if (content.match(r.from)) {
      content = content.replace(r.from, r.to);
      changed = true;
    }
  });

  if (changed) {
    fs.writeFileSync(f, content);
    console.log('Updated ' + f);
  }
});
