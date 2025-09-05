import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/layout/site-header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Next Arcade",
  description: "Tiny Next.js mini-games",
};

export default function RootLayout({ children }: { children: React.ReactNode; }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-arcade bg-grid min-h-screen antialiased">
        <SiteHeader />
        <main className="container mx-auto max-w-5xl px-4 py-10">
          {children}
        </main>
      </body>
    </html>
  );
}
