import Link from "next/link"
import { signOut } from "@/lib/auth"

// ナビゲーションリンク。将来カテゴリを追加する際もこの配列に1行追加するだけで済む
const NAV_LINKS = [
  { href: "/", label: "ホーム" },
  { href: "/dashboard", label: "チーム管理" },
  { href: "/helpers", label: "助っ人募集" },
  { href: "/members", label: "メンバー募集" },
  { href: "/matches", label: "対戦相手募集" },
  { href: "/grounds", label: "グラウンド譲渡" },
] as const

// ログイン済みユーザー向けの共通ヘッダー（ホーム画面・ダッシュボードで使用）
export function AppHeader({
  userImage,
  userName,
}: {
  userImage?: string | null
  userName?: string | null
}) {
  return (
    <header className="bg-white border-b border-zinc-200 px-4 py-3 flex items-center justify-between gap-3 sticky top-0 z-10">
      <Link href="/" className="font-bold text-zinc-900 text-lg shrink-0">
        BaseHub
      </Link>

      <nav className="flex items-center gap-3 overflow-x-auto">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors font-medium whitespace-nowrap"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-3 shrink-0">
        {userImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={userImage}
            alt={userName ?? "ユーザー"}
            className="w-8 h-8 rounded-full border border-zinc-200"
          />
        )}
        <form
          action={async () => {
            "use server"
            await signOut({ redirectTo: "/" })
          }}
        >
          <button
            type="submit"
            className="text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
          >
            ログアウト
          </button>
        </form>
      </div>
    </header>
  )
}
