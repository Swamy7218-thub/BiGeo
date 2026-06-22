import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BiGeo — Book a Shipment",
  description: "Rural India's Last-Mile OS — book, quote, and track shipments.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
