import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { UserNav } from "./UserNav";
import { Button } from "@/components/ui/button"; // Use correct alias

export function Navbar() {
  return (
    <nav className="border-b bg-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left Side: Logo/Title and Nav Links */}
        <div className="flex items-center space-x-6">
          <Link href="/dashboard" className="text-lg font-semibold">
            ✨ HemoConnect
          </Link>
          {/* Navigation Links Placeholder - Map over links later */}
          <div className="hidden items-center space-x-4 md:flex">
             <Link href="/dashboard">
                 <Button variant="ghost" size="sm">Dashboard</Button>
             </Link>
             <Link href="/forum">
                 <Button variant="ghost" size="sm">Forum</Button>
             </Link>
             <Link href="/resources">
                 <Button variant="ghost" size="sm">Resources</Button>
             </Link>
             {/* Add more links as needed */}
          </div>
        </div>

        {/* Right Side: Theme Toggle and UserNav */}
        <div className="flex items-center space-x-3">
          <ThemeToggle />
          <UserNav />
          {/* Mobile Menu Button - Add later if needed */}
          {/* <Button variant="ghost" size="icon" className="md:hidden">...</Button> */}
        </div>
      </div>
    </nav>
  );
}