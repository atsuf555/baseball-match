import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"

// Edge Runtime で動作するミドルウェア
// Prisma を含まない auth.config.ts を使用してルート保護を行う
const { auth } = NextAuth(authConfig)

export default auth

export const config = {
  matcher: [
    // API routes, static files, favicon を除くすべてのルートに適用
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
