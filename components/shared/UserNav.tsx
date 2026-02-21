"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient"; // Use correct alias
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Use correct alias
import { Button } from "@/components/ui/button"; // Use correct alias
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Use correct alias
import type { User } from "@supabase/supabase-js";

export function UserNav() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    fetchUser();
  }, [supabase.auth]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/"); // Redirect to homepage after logout
    router.refresh(); // Ensure layout re-renders for logged-out state
  };

  const getInitials = (email?: string | null): string => {
    if (!email) return "?";
    return email[0].toUpperCase();
  };

  if (loading) {
    // Optional: Show a loading state or placeholder
    return (
      <div className="size-9 animate-pulse rounded-full bg-muted"></div>
    );
  }

  if (!user) {
    // Should not happen if middleware is working, but good fallback
    return (
       <Link href="/login">
         <Button variant="outline" size="sm">Login</Button>
       </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative size-9 rounded-full">
          <Avatar className="size-9">
            {/* Add AvatarImage if you store profile pictures later */}
            {/* <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email} /> */}
            <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Account</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <Link href="/profile/me"> {/* Link to a future 'my profile' page */}
            <DropdownMenuItem className="cursor-pointer">
              Profile
            </DropdownMenuItem>
           </Link>
          {/* Add more items like Settings here if needed */}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}