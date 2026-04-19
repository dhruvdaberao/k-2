"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const refreshServiceWorker = async () => {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
      } catch {
        // ignore: we still attempt a fresh registration
      }

      navigator.serviceWorker.register("/sw.js?v=3", { updateViaCache: "none" }).catch(() => {
        // silent fail to avoid runtime noise in unsupported/proxied environments
      });
    };

    refreshServiceWorker();
  }, []);

  return null;
}
