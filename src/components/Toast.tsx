"use client";

import { showToast as newShowToast } from "@/hooks/useToast";

// Compatibility bridge: allows the rest of the app to keep using 
// import { showToast } from "@/components/Toast"
export function showToast(message: string, action?: { label: string; onClick: () => void }) {
  // Note: New toast doesn't support actions yet, but we'll pass the message
  newShowToast(message);
}

// Dummy component since the real one is now in Layout via ToastProvider
export default function Toast() {
  return null;
}
