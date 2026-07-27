import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

const PUBLIC_PREFIXES = ["/auth/signin", "/auth/signup"];

export default auth((request) => {
  const { pathname } = request.nextUrl;
  const isAuthenticated = Boolean(request.auth?.user);
  const isPublicPage = PUBLIC_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );

  if (isAuthenticated && (isPublicPage || pathname === "/")) {
    return NextResponse.redirect(new URL("/dashboard", request.nextUrl));
  }

  if (isAuthenticated || isPublicPage) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      {
        data: null,
        error: {
          message: "Sesi kamu sudah berakhir. Masuk kembali untuk melanjutkan.",
          code: "UNAUTHORIZED",
        },
      },
      { status: 401 },
    );
  }

  const signInUrl = new URL("/auth/signin", request.nextUrl);
  if (pathname !== "/") {
    signInUrl.searchParams.set("callbackUrl", pathname);
  }
  return NextResponse.redirect(signInUrl);
});

export const config = {
  matcher: [
    /*
     * Everything except: NextAuth's own routes, the signup endpoint,
     * Next internals, and static files.
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
