"use client"; // Needs to be a client component to use useEffect

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { cn } from "@/lib/utils";
import React, { useState, useEffect } from "react"; // Import useState, useEffect

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Note: Metadata export might need adjustment if layout becomes client component fully.
// Consider moving Metadata to specific pages or using generateMetadata if needed.
// For now, keep it simple for debugging.
// export const metadata: Metadata = { ... }; // Removed for simplicity, add back later

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // --- Client Mount Check ---
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  // --- End Client Mount Check ---

  // NOTE: You cannot export Metadata directly from a Client Component ('use client')
  // You would need to handle title/description differently, e.g., in child pages
  // or using a different pattern if metadata needs to be dynamic based on client state (unlikely here).

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
          {/* Add basic title/desc here if removing metadata export */}
          <title>HemoConnect - AI Peer Matching for Hemophilia</title>
          <meta name="description" content="Connect with others in the hemophilia community based on shared experiences." />
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          geistSans.variable,
          geistMono.variable
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* Only render ThemeToggle after component has mounted */}
          {isMounted && (
            <div className="absolute top-4 right-4 z-50">
              <ThemeToggle />
            </div>
          )}
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}

