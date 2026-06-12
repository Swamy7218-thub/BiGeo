"use client";

import dynamic from "next/dynamic";

// SSR-safe Leaflet import
const MapInner = dynamic(() => import("./map-inner"), { ssr: false, loading: () => <div className="h-full bg-[var(--bg)] animate-pulse" /> });

export function NetworkMap() {
  return <MapInner />;
}
