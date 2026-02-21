import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "HemoConnect — Community for People with Hemophilia",
    template: "%s | HemoConnect",
  },
  description:
    "Connect with peers, share experiences, and access resources in a supportive community built for people living with hemophilia and bleeding disorders.",
  keywords: [
    "hemophilia",
    "bleeding disorders",
    "community",
    "peer support",
    "factor VIII",
    "factor IX",
    "von Willebrand",
  ],
  openGraph: {
    type: "website",
    siteName: "HemoConnect",
    title: "HemoConnect — Community for People with Hemophilia",
    description:
      "Connect with peers, share experiences, and access resources in a supportive community platform.",
  },
  twitter: {
    card: "summary_large_image",
    title: "HemoConnect",
    description:
      "A supportive community platform for people with hemophilia and bleeding disorders.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            {children}
          </TooltipProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
