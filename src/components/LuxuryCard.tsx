// "use client";

// import Link from "next/link";
// import Image from "next/image";
// import { useEffect, useState } from "react";
// import type { Product } from "@/types";
// import { addToCart, addToWishlist, addToCollection } from "@/lib/actions";

// export default function LuxuryCard({ product }: { product: Product }) {
//   const [adding, setAdding] = useState(false);
//   const [hearted, setHearted] = useState(false);

//   useEffect(() => {
//     if (typeof window === "undefined") return;
//     try {
//       const wl: string[] = JSON.parse(localStorage.getItem("wishlist") || "[]");
//       setHearted(wl.includes(product.slug));
//     } catch {}
//   }, [product.slug]);

//   const onAdd = () => {
//     setAdding(true);
//     try { addToCart(product, 1); } finally { setAdding(false); }
//   };

//   const toggleWishlist = () => {
//     if (typeof window === "undefined") return;
//     try {
//       const wl: string[] = JSON.parse(localStorage.getItem("wishlist") || "[]");
//       if (wl.includes(product.slug)) {
//         const next = wl.filter(s => s !== product.slug);
//         localStorage.setItem("wishlist", JSON.stringify(next));
//         setHearted(false);
//       } else {
//         addToWishlist(product);
//         setHearted(true);
//       }
//     } catch {
//       addToWishlist(product);
//       setHearted(true);
//     }
//   };

//   return (
//     <article className="plp-card group bg-transparent w-full max-w-[320px]">
//       {/* media wrapper MUST be relative so the heart positions on the image */}
//       <div className="relative">
//         <button
//           aria-label={hearted ? "Remove from wishlist" : "Add to wishlist"}
//           title={hearted ? "Wishlisted" : "Like"}
//           className={`heart-container ${hearted ? "wishlisted" : ""}`}
//           onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(); }}
//         >
//           <div className="svg-container">
//             <svg className="svg-outline" xmlns="http://www.w3.org/2000/svg" fill="none"
//                  viewBox="0 0 24 24" strokeWidth={1.5}>
//               <path strokeLinecap="round" strokeLinejoin="round"
//                 d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"/>
//             </svg>
//             <svg className="svg-filled" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
//               <path fillRule="evenodd" clipRule="evenodd"
//                 d="M12.001 21.243c-.414 0-.83-.133-1.177-.4C5.001 16.478 2 12.718 2 8.75 2 6.127 4.083 4.001 6.75 4.001c1.704 0 3.252.988 4.001 2.453.749-1.465 2.297-2.453 4.001-2.453 2.667 0 4.75 2.127 4.75 4.75 0 3.968-3.001 7.728-8.824 12.093-.347.267-.763.4-1.177.4Z"/>
//             </svg>
//             <svg className="svg-celebrate" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
//               <polygon points="10,10 20,20"></polygon>
//               <polygon points="10,50 20,50"></polygon>
//               <polygon points="20,80 30,70"></polygon>
//               <polygon points="90,10 80,20"></polygon>
//               <polygon points="90,50 80,50"></polygon>
//               <polygon points="80,80 70,70"></polygon>
//             </svg>
//           </div>
//         </button>

//         <Link href={`/products/${product.slug}`} aria-label={product.title} className="block">
//           <Image
//             src={product.images?.[0] || "/placeholder.png"}
//             alt={product.title}
//             width={1000}
//             height={1250}
//             className="w-full h-auto object-cover"
//             sizes="(max-width: 520px) 92vw, (max-width: 900px) 44vw, (max-width: 1400px) 28vw, 320px"
//             draggable={false}
//           />
//         </Link>
//       </div>

//       <div className="pt-3">
//         <div className="flex items-start justify-between gap-4">
//           <h3 className="lv-title leading-snug">
//             <Link href={`/products/${product.slug}`} className="hover:underline underline-offset-4">
//               {product.title}
//             </Link>
//           </h3>
//           <div className="lv-price">₹{product.price}</div>
//         </div>
//       </div>

//       <div className="mt-3 flex items-center gap-3">
//         <button onClick={onAdd} className="btn-luxe" disabled={adding}>
//           {adding ? "Adding…" : "Add to Cart"}
//         </button>
//         <button onClick={() => addToCollection(product)} className="btn-outline">
//           + Collection
//         </button>
//       </div>
//     </article>
//   );
// }
