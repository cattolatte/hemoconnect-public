import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do NOT add logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could cause users
  // to be randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Public routes that don't require authentication
  const isPublicRoute =
    request.nextUrl.pathname === "/" ||
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/signup") ||
    request.nextUrl.pathname.startsWith("/auth-callback") ||
    request.nextUrl.pathname.startsWith("/banned");

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from landing & auth pages
  const isAuthRoute =
    request.nextUrl.pathname === "/" ||
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/signup");

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Banned / suspended user check — block access to all protected routes
  if (user && !request.nextUrl.pathname.startsWith("/banned")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, banned_at, ban_reason, suspended_until, suspension_reason")
      .eq("id", user.id)
      .single();

    if (profile) {
      // Permanently banned
      if (profile.banned_at) {
        const url = request.nextUrl.clone();
        url.pathname = "/banned";
        url.searchParams.set("type", "banned");
        if (profile.ban_reason) {
          url.searchParams.set("reason", profile.ban_reason);
        }
        return NextResponse.redirect(url);
      }

      // Temporarily suspended (only if suspension hasn't expired)
      if (profile.suspended_until) {
        const suspendedUntil = new Date(profile.suspended_until);
        if (suspendedUntil > new Date()) {
          const url = request.nextUrl.clone();
          url.pathname = "/banned";
          url.searchParams.set("type", "suspended");
          url.searchParams.set("until", profile.suspended_until);
          if (profile.suspension_reason) {
            url.searchParams.set("reason", profile.suspension_reason);
          }
          return NextResponse.redirect(url);
        }
      }

      // Admin route protection — require admin or moderator role
      if (request.nextUrl.pathname.startsWith("/admin")) {
        if (profile.role !== "admin" && profile.role !== "moderator") {
          const url = request.nextUrl.clone();
          url.pathname = "/dashboard";
          return NextResponse.redirect(url);
        }
      }
    }
  }

  // IMPORTANT: Return the supabaseResponse object as-is. Do not create
  // a new NextResponse without copying cookies from supabaseResponse.
  // Failing to do so will cause the browser and server to go out of sync
  // and terminate the user's session prematurely.

  return supabaseResponse;
}
