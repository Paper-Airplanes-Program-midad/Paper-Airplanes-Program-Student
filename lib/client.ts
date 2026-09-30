"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

export function useDeviceTimezone(fallback = "UTC"): string {
  return useSyncExternalStore(
    noopSubscribe,
    () => {
      try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || fallback;
      } catch {
        return fallback;
      }
    },
    () => fallback,
  );
}

export function useNow(step = 30_000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), step);
    return () => window.clearInterval(timer);
  }, [step]);

  return now;
}

export function useLocationPath(): string | null {
  return useSyncExternalStore(
    noopSubscribe,
    () => window.location.pathname,
    () => null,
  );
}

export function useStoredValue(key: string, event: string): string | null | undefined {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener(event, onChange);
      window.addEventListener("storage", onChange);
      return () => {
        window.removeEventListener(event, onChange);
        window.removeEventListener("storage", onChange);
      };
    },
    () => {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    () => undefined,
  );
}

export function writeStored(key: string, value: string | null, event: string) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {}
  window.dispatchEvent(new Event(event));
}
