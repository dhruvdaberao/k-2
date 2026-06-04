const fs = require('fs');
const path = 'src/app/reviews/[productId]/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldReviewItem = `                <div className="flex flex-col md:flex-row md:justify-between items-start gap-4">
                  <div className="flex-1 w-full">
                    <div className="flex gap-1.5 md:gap-2 mb-3 md:mb-5">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <StarIcon key={j} filled={j < r.rating} size={18} />
                      ))}
                    </div>
                    {r.review && (
                      <p className="text-[15px] md:text-xl lg:text-2xl text-[#333] leading-relaxed font-medium">
                        "{r.review}"
                      </p>
                    )}
                  </div>

                  <div className="text-left md:text-right flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto mt-2 md:mt-0">
                    <p className="text-sm md:text-lg text-[#5a3e2b] opacity-70 font-bold mb-0 md:mb-3">
                      – by {r.author_name}
                    </p>

                    {r.user_id === user?.id && (
                      <button
                        onClick={() => setDeleteConfirm({ show: true, id: r.id })}
                        className="bg-[#5a3e2b] text-white border-none py-1.5 px-4 md:py-2 md:px-6 rounded-lg text-xs md:text-sm font-bold cursor-pointer transition-colors hover:bg-red-700"
                      >
                        DELETE
                      </button>
                    )}
                  </div>
                </div>`;

const newReviewItem = `                <div className="review-item-inner">
                  <div style={{ flex: 1 }}>
                    <div className="review-stars-wrap">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <StarIcon key={j} filled={j < r.rating} size={18} />
                      ))}
                    </div>
                    {r.review && (
                      <p className="review-text">
                        "{r.review}"
                      </p>
                    )}
                  </div>

                  <div className="review-meta">
                    <p className="review-author">
                      – by {r.author_name}
                    </p>

                    {r.user_id === user?.id && (
                      <button
                        onClick={() => setDeleteConfirm({ show: true, id: r.id })}
                        className="review-delete-btn"
                      >
                        DELETE
                      </button>
                    )}
                  </div>
                </div>`;

content = content.replace(oldReviewItem, newReviewItem);

const extraCSS = `
          .review-item-inner { display: flex; justify-content: space-between; align-items: flex-start; }
          .review-stars-wrap { display: flex; gap: 5px; margin-bottom: 12px; }
          .review-text { margin: 0; font-size: 15px; color: #333; line-height: 1.7; font-weight: 500; }
          .review-meta { text-align: right; display: flex; flex-direction: column; align-items: flex-end; margin-left: 16px; }
          .review-author { margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #5a3e2b; opacity: 0.7; }
          .review-delete-btn { background-color: #5a3e2b; color: white; border: none; padding: 6px 16px; border-radius: 8px; font-size: 11px; font-weight: 700; cursor: pointer; transition: all 0.2s ease; }
          
          @media (min-width: 1024px) {
            .review-stars-wrap { gap: 8px; margin-bottom: 20px; }
            .review-text { font-size: 20px; }
            .review-author { font-size: 18px; margin-bottom: 16px; }
            .review-delete-btn { padding: 10px 24px; font-size: 14px; border-radius: 12px; }
          }
        \`}</style>`;

content = content.replace(/`\}<\/style>/, extraCSS);

fs.writeFileSync(path, content);
