const fs = require('fs');

const files = [
  'src/app/cart/page.tsx',
  'src/app/checkout/page.tsx',
  'src/app/search/search-page-content.tsx',
  'src/app/wishlist/page.tsx',
  'src/components/CheckoutAddons.tsx',
  'src/components/SearchModal.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/\.then\(\(\s*\{\s*data\s*\}\s*\)\s*=>/g, '.then(({ data }: { data: any }) =>');
    fs.writeFileSync(file, content);
  }
});

const checkoutPath = 'src/app/checkout/page.tsx';
if (fs.existsSync(checkoutPath)) {
  let checkout = fs.readFileSync(checkoutPath, 'utf8');
  checkout = checkout.replace(/function resolveProduct[\s\S]*?^}/m, '');
  fs.writeFileSync(checkoutPath, checkout);
}

const sitemapPath = 'src/app/sitemap.ts';
if (fs.existsSync(sitemapPath)) {
  let sitemap = fs.readFileSync(sitemapPath, 'utf8');
  sitemap = sitemap.replace(/products\.map\(\(product\)/g, 'products.map((product: any)');
  fs.writeFileSync(sitemapPath, sitemap);
}

const reviewsPath = 'src/app/reviews/[productId]/page.tsx';
if (fs.existsSync(reviewsPath)) {
  let reviews = fs.readFileSync(reviewsPath, 'utf8');
  reviews = reviews.replace(/products\.find\(\(p\)/g, 'products.find((p: any)');
  fs.writeFileSync(reviewsPath, reviews);
}

console.log("Types fixed!");
