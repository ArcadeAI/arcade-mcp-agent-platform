import { NextResponse, type NextRequest } from "next/server";
import { auth } from "./auth";

export async function updateSession(request: NextRequest) {
  const session = await auth();
  
  // Allow access in development without login
  const isDevelopment = process.env.NODE_ENV === "development";
  const isLoggedIn = !!session?.user;

  // Redirect users from the /inbox page to the homepage
  if (request.nextUrl.pathname.startsWith("/inbox")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // In production, require authentication
  if (!isDevelopment && !isLoggedIn) {
    // Check if this is an API request
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 },
      );
    }

    // For page requests, redirect to root for Okta login
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next({
    request,
  });
}
