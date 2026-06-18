import { signIn } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { formatGameDateTime } from "@/lib/utils"
import Link from "next/link"

// DB から最新のチーム一覧・助っ人募集一覧を取得して表示するため、静的プリレンダーを無効化する
export const dynamic = "force-dynamic"

// トップページ。ログイン不要で、チーム一覧と助っ人募集一覧を公開する。
// ログイン済みユーザーは middleware により /dashboard にリダイレクトされるため、
// ここは実質的に未ログインの訪問者向けのページとして機能する。
export default async function LandingPage() {
  const teams = await prisma.team.findMany({
    include: { _count: { select: { members: true } } },
    orderBy: { createdAt: "desc" },
  })

  const now = new Date()
  const helperRequests = await prisma.helperRequest.findMany({
    where: { status: "OPEN", game: { startsAt: { gte: now } } },
    include: {
      game: {
        select: { startsAt: true, location: true, team: { select: { name: true } } },
      },
      _count: { select: { applications: true } },
    },
    orderBy: { game: { startsAt: "asc" } },
    take: 3,
  })

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* ヘッダー・ログイン */}
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-lg mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="inline-flex items-center justify-center w-11 h-11 bg-blue-600 rounded-2xl shrink-0">
              <span className="text-white text-xl font-bold">B</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-900">BaseHub</h1>
              <p className="text-zinc-500 text-sm">草野球チームの出欠管理をシンプルに</p>
            </div>
          </div>

          <form
            action={async () => {
              "use server"
              await signIn("google", { redirectTo: "/dashboard" })
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 bg-white border border-zinc-300 rounded-xl py-3 px-4 text-zinc-700 font-medium text-sm hover:bg-zinc-50 transition-colors shadow-sm"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Googleでログイン
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-8">
        {/* 助っ人募集の一覧（一部） */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-zinc-900">助っ人募集</h2>
            <Link
              href="/helpers"
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors font-medium"
            >
              すべて見る
            </Link>
          </div>
          {helperRequests.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-xl p-6 text-center">
              <p className="text-sm text-zinc-400">現在募集中の助っ人はありません</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {helperRequests.map((r) => (
                <li
                  key={r.id}
                  className="bg-white border border-zinc-200 rounded-xl p-4"
                >
                  <p className="text-xs text-zinc-400">{r.game.team.name}</p>
                  <p className="text-sm font-semibold text-zinc-900 mt-0.5">
                    {formatGameDateTime(r.game.startsAt)}
                  </p>
                  <p className="text-sm text-zinc-500 mt-0.5">
                    {r.game.location} ・ 募集 {r.capacity}人 ・ 応募 {r._count.applications}人
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* チーム一覧 */}
        <section>
          <h2 className="text-base font-semibold text-zinc-900 mb-3">チーム一覧</h2>
          {teams.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-xl p-6 text-center">
              <p className="text-sm text-zinc-400">まだチームが登録されていません</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {teams.map((team) => (
                <li key={team.id}>
                  <Link
                    href={`/teams/${team.id}`}
                    className="block bg-white border border-zinc-200 rounded-xl p-4 hover:border-zinc-300 transition-colors"
                  >
                    <h3 className="font-semibold text-zinc-900 truncate">{team.name}</h3>
                    {team.description && (
                      <p className="text-sm text-zinc-500 mt-1 line-clamp-2">
                        {team.description}
                      </p>
                    )}
                    <p className="text-xs text-zinc-400 mt-2">
                      メンバー {team._count.members}人
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  )
}
