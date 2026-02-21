"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
// Corrected import path for the type
import type { ThemeProviderProps } from "next-themes";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class" // Use class-based theming
      defaultTheme="system" // Default to user's system preference
      enableSystem // Enable system preference detection
      disableTransitionOnChange // Optional: disable animations on theme change
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
