import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { formatGameDateTime } from "@/lib/utils"
import Link from "next/link"
import { HelperApplyButton } from "./HelperApplyButton"

// 助っ人募集の公開一覧。ログイン不要で閲覧でき、応募にはログインが必要
export default async function HelpersPage() {
  const session = await auth()

  // リクエストごとに実行される動的 Server Component なので現在時刻の参照は妥当
  const now = new Date()

  const requests = await prisma.helperRequest.findMany({
    where: { game: { startsAt: { gte: now } } },
    include: {
      game: {
        select: {
          id: true,
          teamId: true,
          startsAt: true,
          location: true,
          startTime: true,
          team: { select: { name: true } },
        },
      },
      _count: { select: { applications: true } },
      applications: session
        ? { where: { userId: session.user.id }, select: { id: true } }
        : false,
    },
    orderBy: [{ status: "asc" }, { game: { startsAt: "asc" } }],
  })

  // ログイン済みなら、自分が所属するチームIDの集合を取得（応募ボタンの表示判定に使う）
  const myTeamIds = session
    ? new Set(
        (
          await prisma.teamMember.findMany({
            where: { userId: session.user.id },
            select: { teamId: true },
          })
        ).map((m) => m.teamId)
      )
    : new Set<string>()

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Link
          href="/"
          className="text-zinc-500 hover:text-zinc-700 transition-colors p-1 -ml-1"
          aria-label="戻る"
        >
          ←
        </Link>
        <h1 className="font-semibold text-zinc-900 truncate">助っ人募集</h1>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {requests.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-xl p-8 text-center">
            <p className="text-sm text-zinc-400">
              現在募集中の助っ人はありません
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {requests.map((r) => {
              const isMember = myTeamIds.has(r.game.teamId)
              const isApplied = session ? r.applications.length > 0 : false
              return (
                <li
                  key={r.id}
                  className="bg-white border border-zinc-200 rounded-xl p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs text-zinc-400">{r.game.team.name}</p>
                      <h2 className="text-sm font-semibold text-zinc-900 mt-0.5">
                        {formatGameDateTime(r.game.startsAt)}
                      </h2>
                      <p className="text-sm text-zinc-500 mt-0.5">
                        {r.game.location} ・ 開始 {r.game.startTime}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-xs px-1.5 py-0.5 rounded font-medium ${
                        r.status === "OPEN"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-zinc-100 text-zinc-500"
                      }`}
                    >
                      {r.status === "OPEN" ? "募集中" : "募集終了"}
                    </span>
                  </div>

                  <p className="text-sm text-zinc-700 mt-3">
                    {r.positions ?? "ポジション指定なし"}
                    <span className="text-zinc-400 ml-1.5">
                      （募集 {r.capacity}人 ・ 応募 {r._count.applications}人）
                    </span>
                  </p>

                  {r.note && (
                    <p className="text-xs text-zinc-500 mt-1 whitespace-pre-wrap">
                      {r.note}
                    </p>
                  )}

                  <div className="mt-3 pt-3 border-t border-zinc-100">
                    {isMember ? null : r.status === "CLOSED" ? (
                      <span className="text-sm text-zinc-400">
                        この募集は終了しました
                      </span>
                    ) : !session ? (
                      <Link
                        href="/"
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                      >
                        ログインして応募する
                      </Link>
                    ) : (
                      <HelperApplyButton
                        gameId={r.game.id}
                        requestId={r.id}
                        initialApplied={isApplied}
                      />
                    )}
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
