import { Navbar } from "@/components/shared/Navbar"; // Use correct alias
import { Sidebar } from "@/components/shared/Sidebar"; // Use correct alias

export default function MainAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex flex-1">
        {/* Optional Sidebar - uncomment/adjust if needed */}
        {/* <Sidebar /> */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {/* Page content goes here */}
          {children}
        </main>
      </div>
       {/* Optional Footer */}
       {/* <footer className="border-t p-4 text-center text-sm text-muted-foreground">
           © {new Date().getFullYear()} HemoConnect
       </footer> */}
    </div>
  );
}