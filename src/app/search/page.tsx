import SearchPageContent from "./search-page-content";
import { getLiveProducts } from "@/lib/productsApi";

export const metadata = {
  title: "Search",
  description: "Search products by name, category, or price.",
};

export const revalidate = 3600;

export default async function SearchPage() {
  const products = await getLiveProducts();
  return <SearchPageContent initialProducts={products} />;
}
