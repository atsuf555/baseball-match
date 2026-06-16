import { auth, signOut } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { CopyButton } from "@/components/CopyButton"

export default async function DashboardPage() {
  const session = await auth()

  const teams = await prisma.team.findMany({
    where: {
      members: {
        some: { userId: session!.user.id },
      },
    },
    include: {
      _count: { select: { members: true } },
      members: {
        where: { userId: session!.user.id },
        select: { role: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-zinc-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <span className="font-bold text-zinc-900 text-lg">BaseHub</span>
        <div className="flex items-center gap-3">
          {session?.user?.image && (
            <img
              src={session.user.image}
              alt={session.user.name ?? "ユーザー"}
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

      <main className="max-w-lg mx-auto px-4 py-6">
        {/* セクションヘッダー */}
        <div className="flex items-center justify-between mb-4 gap-2">
          <h1 className="text-base font-semibold text-zinc-900 shrink-0">
            所属チーム
          </h1>
          <div className="flex items-center gap-2">
            <Link
              href="/teams/join"
              className="inline-flex items-center gap-1 bg-white border border-zinc-300 text-zinc-700 text-sm px-3.5 py-2 rounded-lg hover:bg-zinc-50 transition-colors font-medium"
            >
              参加
            </Link>
            <Link
              href="/teams/new"
              className="inline-flex items-center gap-1 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <span aria-hidden>+</span> 作成
            </Link>
          </div>
        </div>

        {/* チーム一覧 */}
        {teams.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-xl p-8 text-center">
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-blue-500 text-xl">⚾</span>
            </div>
            <p className="text-zinc-500 text-sm mb-4">
              まだチームに所属していません
            </p>
            <div className="flex flex-col items-center gap-2">
              <Link
                href="/teams/new"
                className="inline-block bg-blue-600 text-white text-sm px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                チームを作成する
              </Link>
              <Link
                href="/teams/join"
                className="inline-block text-sm text-blue-600 hover:text-blue-800 transition-colors font-medium py-1"
              >
                招待コードで参加する
              </Link>
            </div>
          </div>
        ) : (
          <ul className="space-y-3">
            {teams.map((team) => {
              const myRole = team.members[0]?.role
              return (
                <li key={team.id}>
                  <div className="bg-white border border-zinc-200 rounded-xl p-4 hover:border-zinc-300 transition-colors">
                    <Link href={`/teams/${team.id}`} className="block">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h2 className="font-semibold text-zinc-900 truncate">
                              {team.name}
                            </h2>
                            {myRole === "ADMIN" && (
                              <span className="shrink-0 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                                管理者
                              </span>
                            )}
                          </div>
                          {team.description && (
                            <p className="text-sm text-zinc-500 mt-1 line-clamp-2">
                              {team.description}
                            </p>
                          )}
                          <p className="text-xs text-zinc-400 mt-2">
                            メンバー {team._count.members}人
                          </p>
                        </div>
                      </div>
                    </Link>

                    {/* 招待コード */}
                    <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-zinc-400">招待コード</span>
                        <span className="font-mono text-sm font-semibold text-zinc-700 tracking-widest">
                          {team.inviteCode}
                        </span>
                      </div>
                      <CopyButton text={team.inviteCode} />
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </main>
    </div>
  )
}

