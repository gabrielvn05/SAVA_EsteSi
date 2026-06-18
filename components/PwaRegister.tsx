"use client";

import { useEffect } from "react";

const SW_VERSION = "v4";

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    void (async () => {
      const stored = localStorage.getItem("sava-sw-version");

      if (stored !== SW_VERSION) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((reg) => reg.unregister()));

        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((key) => caches.delete(key)));
        }

        localStorage.setItem("sava-sw-version", SW_VERSION);
      }

      try {
        const reg = await navigator.serviceWorker.register("/sw.js");
        await reg.update();
      } catch {
        // PWA opcional
      }
    })();
  }, []);

  return null;
}
