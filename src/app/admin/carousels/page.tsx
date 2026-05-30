import AdminCarouselsClient from "./AdminCarouselsClient";
import { supabase } from "@/lib/supabaseClient";

export const metadata = {
  title: "Manage Carousels | Admin",
};

export default async function AdminCarouselsPage() {
  const { data } = await supabase.from("hero_slides").select("*").order("position", { ascending: true });
  const initialSlides = data || [];
  
  return <AdminCarouselsClient initialSlides={initialSlides} />;
}
