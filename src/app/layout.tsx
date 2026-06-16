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
      <body className="min-h-full bg-white">{children}</body>
    </html>
  )
}
