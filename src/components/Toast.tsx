"use client";

import { showToast as newShowToast } from "@/lib/toast";

export function showToast(message: string, action?: { label: string; onClick: () => void }) {
  newShowToast(message);
}

export default function Toast() {
  return null;
}
