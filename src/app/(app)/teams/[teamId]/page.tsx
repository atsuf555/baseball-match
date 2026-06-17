import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { formatGameDateTime } from "@/lib/utils"
import { notFound } from "next/navigation"
import Link from "next/link"
import { CopyButton } from "@/components/CopyButton"
import type { Game } from "@prisma/client"

type GameWithAttendingCount = Game & { attendingCount: number }

export default async function TeamDetailPage({
  params,
}: PageProps<"/teams/[teamId]">) {
  const { teamId } = await params
  const session = await auth()

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      members: {
        include: {
          user: { select: { name: true, email: true, image: true } },
        },
        orderBy: { joinedAt: "asc" },
      },
    },
  })

  // チームが存在しない、または自分がメンバーでない場合は 404
  // （所属していないチームの情報は見せない）
  const myMembership = team?.members.find(
    (m) => m.userId === session!.user.id
  )
  if (!team || !myMembership) {
    notFound()
  }

  const isAdmin = myMembership.role === "ADMIN"

  // 試合一覧を取得して「今後」と「過去」に振り分ける
  // 参加人数は出欠一覧画面と同じ集計（ATTENDING の件数）を一覧カードにも出す
  const gamesRaw = await prisma.game.findMany({
    where: { teamId: team.id },
    orderBy: { startsAt: "asc" },
    include: {
      _count: { select: { attendances: { where: { status: "ATTENDING" } } } },
    },
  })
  const games: GameWithAttendingCount[] = gamesRaw.map((g) => ({
    ...g,
    attendingCount: g._count.attendances,
  }))
  // リクエストごとに実行される動的 Server Component なので現在時刻の参照は妥当
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now()
  const upcomingGames = games.filter((g) => g.startsAt.getTime() >= now)
  // 過去は新しい順（直近の試合を上に）
  const pastGames = games
    .filter((g) => g.startsAt.getTime() < now)
    .reverse()

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-zinc-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Link
          href="/dashboard"
          className="text-zinc-500 hover:text-zinc-700 transition-colors p-1 -ml-1"
          aria-label="戻る"
        >
          ←
        </Link>
        <h1 className="font-semibold text-zinc-900 truncate">{team.name}</h1>
        {isAdmin && (
          <span className="shrink-0 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">
            管理者
          </span>
        )}
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* チーム概要 */}
        <section>
          {team.description ? (
            <p className="text-sm text-zinc-600 whitespace-pre-wrap">
              {team.description}
            </p>
          ) : (
            <p className="text-sm text-zinc-400">説明はありません</p>
          )}
        </section>

        {/* 招待コード（管理者のみ表示） */}
        {isAdmin && (
          <section className="bg-white border border-zinc-200 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-zinc-900 mb-1">
              招待コード
            </h2>
            <p className="text-xs text-zinc-400 mb-3">
              このコードを共有してメンバーを招待しましょう
            </p>
            <div className="flex items-center justify-between bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3">
              <span className="font-mono text-lg font-semibold text-zinc-800 tracking-[0.3em]">
                {team.inviteCode}
              </span>
              <CopyButton text={team.inviteCode} />
            </div>
          </section>
        )}

        {/* 試合 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-zinc-900">試合</h2>
            {isAdmin && (
              <Link
                href={`/teams/${teamId}/games/new`}
                className="inline-flex items-center gap-1 bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <span aria-hidden>+</span> 試合を作成
              </Link>
            )}
          </div>

          {games.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-xl p-6 text-center">
              <p className="text-sm text-zinc-400">まだ試合がありません</p>
              {isAdmin && (
                <Link
                  href={`/teams/${teamId}/games/new`}
                  className="inline-block mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  最初の試合を作成する
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              {/* 今後の試合 */}
              <div>
                <h3 className="text-xs font-medium text-zinc-400 mb-2">
                  今後の試合（{upcomingGames.length}）
                </h3>
                {upcomingGames.length === 0 ? (
                  <p className="text-sm text-zinc-400 px-1">
                    予定されている試合はありません
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {upcomingGames.map((game) => (
                      <GameRow key={game.id} game={game} teamId={teamId} />
                    ))}
                  </ul>
                )}
              </div>

              {/* 過去の試合 */}
              {pastGames.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-zinc-400 mb-2">
                    過去の試合（{pastGames.length}）
                  </h3>
                  <ul className="space-y-2">
                    {pastGames.map((game) => (
                      <GameRow key={game.id} game={game} teamId={teamId} past />
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>

        {/* メンバー一覧 */}
        <section>
          <h2 className="text-sm font-semibold text-zinc-900 mb-3">
            メンバー
            <span className="text-zinc-400 font-normal ml-1.5">
              {team.members.length}人
            </span>
          </h2>
          <ul className="bg-white border border-zinc-200 rounded-xl divide-y divide-zinc-100">
            {team.members.map((member) => (
              <li
                key={member.id}
                className="flex items-center gap-3 px-4 py-3"
              >
                {member.user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={member.user.image}
                    alt={member.user.name ?? "メンバー"}
                    className="w-9 h-9 rounded-full border border-zinc-200 shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 text-sm shrink-0">
                    {(member.user.name ?? "?").charAt(0)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-900 truncate">
                    {member.user.name ?? member.user.email ?? "名称未設定"}
                    {member.userId === session!.user.id && (
                      <span className="text-zinc-400 font-normal ml-1">
                        （あなた）
                      </span>
                    )}
                  </p>
                </div>
                <span
                  className={
                    member.role === "ADMIN"
                      ? "shrink-0 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium"
                      : "shrink-0 text-xs bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded font-medium"
                  }
                >
                  {member.role === "ADMIN" ? "管理者" : "メンバー"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  )
}

// 試合一覧の1行（チーム詳細から試合詳細へのリンク）
function GameRow({
  game,
  teamId,
  past = false,
}: {
  game: GameWithAttendingCount
  teamId: string
  past?: boolean
}) {
  return (
    <li>
      <Link
        href={`/teams/${teamId}/games/${game.id}`}
        className={`block bg-white border border-zinc-200 rounded-xl p-4 hover:border-zinc-300 transition-colors ${
          past ? "opacity-70" : ""
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-zinc-900 truncate">
            {formatGameDateTime(game.startsAt)}
          </p>
          <span className="text-zinc-300 shrink-0" aria-hidden>
            ›
          </span>
        </div>
        <p className="text-sm text-zinc-500 mt-1 truncate">{game.location}</p>
        <p className="text-xs text-zinc-400 mt-1">
          開始 {game.startTime}
          {game.capacity != null && ` ・ 定員 ${game.capacity}人`}
          {` ・ 参加 ${game.attendingCount}人`}
        </p>
      </Link>
    </li>
  )
}
