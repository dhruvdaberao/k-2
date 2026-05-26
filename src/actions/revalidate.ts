"use server";

import { revalidatePath } from "next/cache";

export async function revalidateStorefront() {
  revalidatePath("/");
  revalidatePath("/collections");
  revalidatePath("/collections/[slug]", "page");
}
