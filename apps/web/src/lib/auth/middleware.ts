import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  // Temporarily allow all requests - will be replaced with NextAuth in Phase 2
  const response = NextResponse.next({
    request,
  });

  // Redirect users from the /inbox page to the homepage
  if (request.nextUrl.pathname.startsWith("/inbox")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}
