import React from "react";

// No need to import globals.css, fonts, ThemeProvider, Toaster, or Metadata here.
// They are already applied by the root layout (app/layout.tsx).

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // This div centers the login/signup forms within the overall page structure
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      {children}
    </div>
  );
}
