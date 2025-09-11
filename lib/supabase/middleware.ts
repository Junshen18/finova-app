import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // If the env vars are not set, skip middleware check. You can remove this once you setup the project.
  if (!hasEnvVars) {
    return supabaseResponse;
  }

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
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (
    request.nextUrl.pathname !== "/" &&
    !user &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/auth")
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // Authorization gate: only members can access a group's page
  if (user && request.nextUrl.pathname.startsWith("/protected/groups/")) {
    const match = request.nextUrl.pathname.match(/^\/protected\/groups\/(\d+)/);
    if (match) {
      const groupId = Number(match[1]);
      if (Number.isFinite(groupId)) {
        const { data: membership, error: membershipError } = await supabase
          .from("split_group_member")
          .select("user_id")
          .eq("group_id", groupId)
          .eq("user_id", user.id)
          .limit(1);

        if (!membershipError && (!membership || membership.length === 0)) {
          const url = request.nextUrl.clone();
          url.pathname = "/protected/groups";
          return NextResponse.redirect(url);
        }
      }
    }
  }

  // Role-based routing: admins should stay under /protected/admin
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_locked")
      .eq("user_id", user.id)
      .single();

    const role = (profile?.role || "").toLowerCase();
    const path = request.nextUrl.pathname;
    const isAdminArea = path.startsWith("/protected/admin");
    const isProtectedArea = path.startsWith("/protected");

    // If locked, block app access except when already on an auth page
    if (profile?.is_locked) {
      const isAuthPage = path.startsWith("/auth");
      if (!isAuthPage) {
        const url = request.nextUrl.clone();
        url.pathname = "/auth/error";
        url.searchParams.set("error", "account_locked");
        return NextResponse.redirect(url);
      }
      return supabaseResponse;
    }

    if (role === "admin") {
      // If admin tries to access user-only sections, redirect to admin dashboard
      const userOnlyPrefixes = [
        "/protected/transactions",
        "/protected/accounts",
        "/protected/ai-analysis",
        "/protected/friends",
        "/protected/games",
        "/protected/groups",
        "/protected/leaderboard",
        "/protected/profile",
        "/protected/subscription",
        "/protected/add",
        "/protected/dashboard",
        "/protected/page",
      ];
      if (!isAdminArea && userOnlyPrefixes.some((p) => path.startsWith(p))) {
        const url = request.nextUrl.clone();
        url.pathname = "/protected/admin";
        return NextResponse.redirect(url);
      }
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
