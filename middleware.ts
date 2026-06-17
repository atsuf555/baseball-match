import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Edge Runtime で動作するミドルウェア
//
// 本アプリは session: { strategy: "database" } を使用しており、セッションクッキーは
// DBの行を指す生のトークン文字列（JWEではない）。NextAuth の auth() ラッパーを
// adapter なしの authConfig だけで呼び出すと、adapter が無いことから内部で
// session strategy が "jwt" だと判断され、このトークンを JWE として復号しようとして
// `Invalid Compact JWE` エラーになり、常に未ログイン扱いになってしまう（Edge は
// Prisma 経由でDBへ問い合わせられないため、ここで本当のセッション検証はできない）。
// そのため middleware ではクッキーの有無だけを見た軽量なリダイレクトのみを行い、
// 実際のセッション検証は (app)/layout.tsx 側の auth()（DB検証あり）に委ねる。
const SESSION_COOKIE_NAMES = ["authjs.session-token", "__Secure-authjs.session-token"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isLoggedIn = SESSION_COOKIE_NAMES.some((name) => request.cookies.has(name))
  const isProtected =
    pathname.startsWith("/dashboard") || pathname.startsWith("/teams")

  if (isProtected && !isLoggedIn) {
    const signInUrl = new URL("/", request.url)
    signInUrl.searchParams.set("callbackUrl", request.url)
    return NextResponse.redirect(signInUrl)
  }
  if (pathname === "/" && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: [
    // API routes, static files, favicon を除くすべてのルートに適用
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
