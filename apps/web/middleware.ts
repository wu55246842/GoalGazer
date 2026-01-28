import { NextRequest, NextResponse } from "next/server";
import {
  defaultLanguage,
  getPreferredLanguage,
  normalizeLanguage,
  supportedLanguages,
} from "./i18n";

const PUBLIC_FILE = /\.[^/]+$/;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/generated") ||
    pathname.startsWith("/favicon") ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const pathSegments = pathname.split("/");
  const maybeLang = pathSegments[1];

  if (supportedLanguages.includes(maybeLang as typeof defaultLanguage)) {
    const lang = normalizeLanguage(maybeLang);
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-goalgazer-lang", lang);
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.cookies.set("GG_LANG", lang, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return response;
  }

  const cookieLang = request.cookies.get("GG_LANG")?.value;
  const preferred = normalizeLanguage(
    process.env.DISABLE_AUTO_LANG_REDIRECT === "true"
      ? cookieLang ?? defaultLanguage
      : cookieLang ?? getPreferredLanguage(request.headers.get("accept-language"))
  );

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = pathname === "/" ? `/${preferred}` : `/${preferred}${pathname}`;
  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
