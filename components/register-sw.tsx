"use client";

import { useEffect } from "react";

export default function RegisterSW() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const swUrl = "/sw.js";

    const register = async () => {
      try {
        await navigator.serviceWorker.register(swUrl);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Service worker registration failed", error);
      }
    };

    register();
  }, []);

  return null;
}

