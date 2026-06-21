import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Job Application Agent",
  description: "Job feed, approvals, tracking, and reports",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        <header className="border-b bg-white">
          <nav className="max-w-5xl mx-auto flex gap-6 px-4 py-3 text-sm font-medium">
            <span className="font-semibold mr-4">Job Agent</span>
            <Link href="/" className="hover:text-blue-600">Applications</Link>
            <Link href="/packets" className="hover:text-blue-600">New Packet</Link>
            <Link href="/reports" className="hover:text-blue-600">Reports</Link>
          </nav>
        </header>
        <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
