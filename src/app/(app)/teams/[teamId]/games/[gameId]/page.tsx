import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getMembership } from "@/lib/teams"
import { formatGameDateTime } from "@/lib/utils"
import { notFound } from "next/navigation"
import Link from "next/link"

export default async function GameDetailPage({
  params,
}: PageProps<"/teams/[teamId]/games/[gameId]">) {
  const { teamId, gameId } = await params
  const session = await auth()

  // メンバーでなければ詳細を見せない
  const membership = await getMembership(teamId, session!.user.id)
  if (!membership) {
    notFound()
  }

  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: { team: { select: { id: true, name: true } } },
  })
  // 試合が存在しない／別チームの試合を指している場合は 404
  if (!game || game.teamId !== teamId) {
    notFound()
  }

  // リクエストごとに実行される動的 Server Component なので現在時刻の参照は妥当
  // eslint-disable-next-line react-hooks/purity
  const isPast = game.startsAt.getTime() < Date.now()

  const details: { label: string; value: string }[] = [
    { label: "試合日時", value: formatGameDateTime(game.startsAt) },
    { label: "集合時間", value: game.meetTime },
    { label: "場所", value: game.location },
    { label: "定員", value: game.capacity != null ? `${game.capacity}人` : "未設定" },
  ]

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Link
          href={`/teams/${teamId}`}
          className="text-zinc-500 hover:text-zinc-700 transition-colors p-1 -ml-1"
          aria-label="戻る"
        >
          ←
        </Link>
        <h1 className="font-semibold text-zinc-900 truncate">試合詳細</h1>
        {isPast && (
          <span className="shrink-0 text-xs bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded font-medium">
            終了
          </span>
        )}
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* 概要カード */}
        <section className="bg-white border border-zinc-200 rounded-xl p-5">
          <p className="text-xs text-zinc-400 mb-1">{game.team.name}</p>
          <h2 className="text-lg font-bold text-zinc-900">
            {formatGameDateTime(game.startsAt)}
          </h2>
          <p className="text-sm text-zinc-500 mt-1">{game.location}</p>
        </section>

        {/* 詳細情報 */}
        <section>
          <dl className="bg-white border border-zinc-200 rounded-xl divide-y divide-zinc-100">
            {details.map((row) => (
              <div key={row.label} className="flex items-start gap-4 px-4 py-3">
                <dt className="text-sm text-zinc-400 w-20 shrink-0">{row.label}</dt>
                <dd className="text-sm text-zinc-900 font-medium flex-1 min-w-0">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* メモ */}
        {game.note && (
          <section>
            <h3 className="text-sm font-semibold text-zinc-900 mb-2">メモ</h3>
            <div className="bg-white border border-zinc-200 rounded-xl p-4">
              <p className="text-sm text-zinc-700 whitespace-pre-wrap">{game.note}</p>
            </div>
          </section>
        )}

        {/* 出欠管理は後続機能で実装予定 */}
        <p className="text-center text-xs text-zinc-400 pt-2">
          出欠管理はこの画面に追加予定です
        </p>
      </main>
    </div>
  )
}
