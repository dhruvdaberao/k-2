"use server";

import { revalidatePath } from "next/cache";

export async function revalidateStorefront() {
  revalidatePath("/");
  revalidatePath("/collections");
  revalidatePath("/collections/[slug]", "page");
  revalidatePath("/products/[slug]", "page");
}

export async function revalidateAdmin() {
  revalidatePath("/admin", "layout");
}
