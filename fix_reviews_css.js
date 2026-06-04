const fs = require('fs');
const path = 'src/app/reviews/[productId]/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Container
content = content.replace(/className="max-w-\[600px\].*?"/g, 'className="reviews-container w-full pb-12"');

// Product Info Card
content = content.replace(/className="mx-4 md:mx-8 bg-\[#f8f4ef\].*?"/g, 'className="product-info-card mx-4 md:mx-8"');

// Product Title
content = content.replace(/className="font-bold text-\[18px\].*?"/g, 'className="product-title"');

// Product Image Container
content = content.replace(/className="w-16 h-16 md:w-32.*?"/g, 'className="product-img-wrap"');

// Add Review Button
content = content.replace(/className="w-full bg-\[#5a3e2b\].*?"/g, 'className="add-review-btn"');

// Rating Breakdown Card
content = content.replace(/className="bg-\[#f8f4ef\] p-6 md:p-10.*?"/g, 'className="rating-bd-card mx-4 md:mx-8"');

// Review List items
content = content.replace(/className="p-6 md:p-10 bg-\[#f1ede8\].*?"/g, 'className="review-card transition-transform duration-300 hover:-translate-y-1"');

// Sort Dropdown Button
content = content.replace(/className="w-full flex items-center justify-between bg-\[#f8f4ef\].*?"/g, 'className="sort-btn"');

// Star text row
content = content.replace(/className="flex items-center gap-3 md:gap-5 mb-3 md:mb-5"/g, 'className="rating-row"');
content = content.replace(/className="text-sm md:text-xl font-extrabold text-\[#5a3e2b\] w-10 md:w-16 flex items-center gap-1 md:gap-2"/g, 'className="rating-star-col"');
content = content.replace(/className="flex-1 h-2.5 md:h-4 bg-white rounded-full overflow-hidden"/g, 'className="rating-bar-bg"');
content = content.replace(/className="text-\[13px\] md:text-lg font-extrabold text-\[#888\] w-8 md:w-12 text-right"/g, 'className="rating-count-col"');

// Rating Title
content = content.replace(/className="text-\[#5a3e2b\] font-extrabold mb-4 md:mb-8 text-xs md:text-base uppercase tracking-wider"/g, 'className="rating-breakdown-title"');

// Inject CSS
const css = `
        <style jsx>{\`
          .reviews-container { max-width: 600px; margin: 0 auto; }
          @media (min-width: 1024px) { .reviews-container { max-width: 900px; } }

          .product-info-card { background-color: #f8f4ef; border-radius: 24px; padding: 20px; display: flex; align-items: center; justify-content: space-between; border: 1px solid #f1ebe6; margin-bottom: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.02); }
          @media (min-width: 1024px) { .product-info-card { border-radius: 32px; padding: 32px; margin-bottom: 48px; } }

          .product-title { font-size: 18px; font-weight: bold; color: #2d2d2d; margin-bottom: 8px; }
          @media (min-width: 1024px) { .product-title { font-size: 32px; margin-bottom: 16px; } }

          .product-img-wrap { width: 64px; height: 64px; border-radius: 16px; overflow: hidden; flex-shrink: 0; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.08); }
          @media (min-width: 1024px) { .product-img-wrap { width: 140px; height: 140px; border-radius: 24px; border: 4px solid white; } }

          .add-review-btn { width: 100%; background-color: #5a3e2b; color: white; padding: 16px; border-radius: 999px; font-weight: 800; font-size: 16px; border: none; cursor: pointer; box-shadow: 0 6px 20px rgba(90,62,43,0.25); transition: transform 0.2s ease; }
          .add-review-btn:hover { transform: scale(1.02); }
          @media (min-width: 1024px) { .add-review-btn { padding: 24px; font-size: 24px; } }

          .rating-bd-card { background-color: #f8f4ef; padding: 24px; border-radius: 28px; border: 1px solid #f1ebe6; margin-bottom: 32px; }
          @media (min-width: 1024px) { .rating-bd-card { padding: 40px; border-radius: 32px; margin-bottom: 48px; } }

          .rating-breakdown-title { color: #5a3e2b; font-weight: 800; margin-bottom: 16px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
          @media (min-width: 1024px) { .rating-breakdown-title { font-size: 16px; margin-bottom: 32px; } }

          .rating-row { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
          @media (min-width: 1024px) { .rating-row { gap: 20px; margin-bottom: 20px; } }

          .rating-star-col { font-size: 14px; font-weight: 800; color: #5a3e2b; width: 40px; display: flex; align-items: center; gap: 4px; }
          @media (min-width: 1024px) { .rating-star-col { font-size: 20px; width: 64px; } }

          .rating-bar-bg { flex: 1; height: 10px; background-color: white; border-radius: 999px; overflow: hidden; }
          @media (min-width: 1024px) { .rating-bar-bg { height: 16px; } }

          .rating-count-col { font-size: 13px; font-weight: 800; color: #888; width: 30px; text-align: right; }
          @media (min-width: 1024px) { .rating-count-col { font-size: 18px; width: 48px; } }

          .review-card { padding: 24px; background-color: #f1ede8; border-radius: 24px; border: 1px solid #e8e2da; margin-bottom: 16px; }
          @media (min-width: 1024px) { .review-card { padding: 40px; border-radius: 32px; margin-bottom: 24px; } }

          .sort-btn { width: 100%; display: flex; align-items: center; justify-content: space-between; background-color: #f8f4ef; border: 2px solid #e8e2da; border-radius: 16px; padding: 12px 18px; font-size: 14px; font-weight: 800; color: #5a3e2b; cursor: pointer; outline: none; transition: all 0.2s ease; box-shadow: 0 4px 12px rgba(90, 62, 43, 0.05); }
          @media (min-width: 1024px) { .sort-btn { padding: 16px 24px; font-size: 18px; border-radius: 20px; } }

          @keyframes dropdownIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        \`}</style>
`;

content = content.replace(/<style jsx>\{`[\s\S]*?`\}<\/style>/g, css);

fs.writeFileSync(path, content);
