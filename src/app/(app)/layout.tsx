import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

// 認証必須ルートの共通レイアウト
// middleware で一次チェック済みだが、ここで二重確認することで型の安全性を保証する
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) {
    redirect("/")
  }
  return <>{children}</>
}
