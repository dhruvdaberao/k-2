const fs = require('fs');
const file = 'src/components/ProductPageClient.tsx';
let content = fs.readFileSync(file, 'utf8');

const badgeBlockStart = content.indexOf('          {/* Badge */}');
const h1Start = content.indexOf('          <h1');
const priceStart = content.indexOf('          {/* Price */}');
const descStart = content.indexOf('          {/* Emotional Description */}');

if (badgeBlockStart !== -1 && h1Start !== -1 && descStart !== -1) {
  const badgeBlock = content.substring(badgeBlockStart, h1Start);
  const titleAndPriceBlock = content.substring(h1Start, descStart);
  
  const before = content.substring(0, badgeBlockStart);
  const after = content.substring(descStart);

  content = before + titleAndPriceBlock + badgeBlock + after;
  fs.writeFileSync(file, content, 'utf8');
  console.log("Successfully reordered ProductPageClient.tsx layout!");
} else {
  console.log("Failed to find blocks");
}
