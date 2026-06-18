import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"

// Edge Runtime で動作する設定（Prisma を含まない）
// middleware.ts から参照される
export const authConfig: NextAuthConfig = {
  providers: [Google],
  pages: {
    signIn: "/",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isProtected =
        nextUrl.pathname.startsWith("/dashboard") ||
        nextUrl.pathname === "/teams/new" ||
        nextUrl.pathname === "/teams/join" ||
        /^\/teams\/[^/]+\/(edit|games)(\/.*)?$/.test(nextUrl.pathname)

      if (isProtected && !isLoggedIn) {
        // 未認証 → サインインページへリダイレクト（pages.signIn = "/"）
        return false
      }
      return true
    },
  },
}
