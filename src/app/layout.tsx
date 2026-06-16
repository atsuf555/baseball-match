import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "BaseHub",
  description: "草野球チームの出欠管理をシンプルに",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" className="h-full">
      {/* ブラウザ拡張が body に属性を注入してハイドレーション警告を出すことがあるため抑制 */}
      <body className="min-h-full bg-white" suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
