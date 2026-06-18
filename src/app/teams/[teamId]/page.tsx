import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { formatGameDateTime, getJSTYear } from "@/lib/utils"
import { notFound } from "next/navigation"
import Link from "next/link"
import { CopyButton } from "@/components/CopyButton"
import { TeamContactLinks } from "@/components/TeamContactLinks"
import type { Game, GameResult } from "@prisma/client"

const RESULT_META: Record<GameResult, { label: string; className: string }> = {
  WIN: { label: "勝", className: "bg-blue-100 text-blue-700" },
  LOSE: { label: "敗", className: "bg-red-100 text-red-700" },
  DRAW: { label: "分", className: "bg-zinc-100 text-zinc-600" },
}

// チーム詳細ページ。ログインなしで誰でも閲覧できる。
// 出欠回答・助っ人募集の管理・試合作成・編集はチームメンバー専用ページ
// （/teams/[teamId]/games/** や /teams/[teamId]/edit）に分離されており、別途ログインが必要。
export default async function TeamDetailPage({
  params,
  searchParams,
}: PageProps<"/teams/[teamId]">) {
  const { teamId } = await params
  const { year: yearParam } = await searchParams
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
  if (!team) {
    notFound()
  }

  const myMembership = session
    ? team.members.find((m) => m.userId === session.user.id)
    : undefined
  const isAdmin = myMembership?.role === "ADMIN"

  // 試合一覧を取得して「今後」と「過去」に振り分ける
  const games = await prisma.game.findMany({
    where: { teamId: team.id },
    orderBy: { startsAt: "asc" },
  })
  // リクエストごとに実行される動的 Server Component なので現在時刻の参照は妥当
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now()
  const upcomingGames = games.filter((g) => g.startsAt.getTime() >= now)
  // 過去は新しい順（直近の試合を上に）
  const pastGames = games.filter((g) => g.startsAt.getTime() < now).reverse()

  // 年別の勝敗集計（結果が登録されている試合のみ）
  const gamesWithResult = games.filter((g) => g.result !== null)
  const years = Array.from(
    new Set(gamesWithResult.map((g) => getJSTYear(g.startsAt)))
  ).sort((a, b) => b - a)
  const selectedYear = years.includes(Number(yearParam)) ? Number(yearParam) : years[0]
  const yearGames = gamesWithResult.filter((g) => getJSTYear(g.startsAt) === selectedYear)
  const record = {
    WIN: yearGames.filter((g) => g.result === "WIN").length,
    LOSE: yearGames.filter((g) => g.result === "LOSE").length,
    DRAW: yearGames.filter((g) => g.result === "DRAW").length,
  }

  const hasContact = team.twitterUrl || team.instagramUrl || team.contactEmail

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-zinc-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Link
          href={session ? "/dashboard" : "/"}
          className="text-zinc-500 hover:text-zinc-700 transition-colors p-1 -ml-1"
          aria-label="戻る"
        >
          ←
        </Link>
        <h1 className="font-semibold text-zinc-900 truncate flex-1">{team.name}</h1>
        {isAdmin && (
          <span className="shrink-0 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">
            管理者
          </span>
        )}
        {isAdmin && (
          <Link
            href={`/teams/${teamId}/edit`}
            className="shrink-0 text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            編集
          </Link>
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

        {/* 年別勝敗成績 */}
        {years.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-zinc-900 mb-3">成績</h2>
            <div className="flex gap-1.5 mb-3 overflow-x-auto">
              {years.map((y) => (
                <Link
                  key={y}
                  href={`/teams/${teamId}?year=${y}`}
                  className={`shrink-0 text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    y === selectedYear
                      ? "bg-blue-600 text-white"
                      : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  {y}年
                </Link>
              ))}
            </div>
            <div className="bg-white border border-zinc-200 rounded-xl p-4 text-center">
              <p className="text-lg font-bold text-zinc-900">
                {selectedYear}年 {record.WIN}勝{record.LOSE}敗{record.DRAW}分
              </p>
            </div>
          </section>
        )}

        {/* 連絡先（参加希望の受付） */}
        {hasContact && (
          <section className="bg-white border border-zinc-200 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-zinc-900 mb-1">
              このチームへの参加希望はこちら
            </h2>
            <p className="text-xs text-zinc-400 mb-3">
              SNS・メールから直接お問い合わせください
            </p>
            <TeamContactLinks
              twitterUrl={team.twitterUrl}
              instagramUrl={team.instagramUrl}
              contactEmail={team.contactEmail}
            />
          </section>
        )}

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
                      <GameRow
                        key={game.id}
                        game={game}
                        teamId={teamId}
                        canLink={!!session}
                      />
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
                      <GameRow
                        key={game.id}
                        game={game}
                        teamId={teamId}
                        past
                        canLink={!!session}
                      />
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
                    {session && member.userId === session.user.id && (
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

// 試合一覧の1行（チーム詳細から試合詳細へのリンク。詳細ページはログイン必須なため、
// 未ログインの場合はリンクにせずスコアのみを表示する）
function GameRow({
  game,
  teamId,
  past = false,
  canLink,
}: {
  game: Game
  teamId: string
  past?: boolean
  canLink: boolean
}) {
  const content = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-zinc-900 truncate">
          {formatGameDateTime(game.startsAt)}
        </p>
        <div className="flex items-center gap-2 shrink-0">
          {game.result && (
            <span
              className={`text-xs px-1.5 py-0.5 rounded font-medium ${RESULT_META[game.result].className}`}
            >
              {RESULT_META[game.result].label} {game.ourScore}-{game.opponentScore}
            </span>
          )}
          {canLink && (
            <span className="text-zinc-300" aria-hidden>
              ›
            </span>
          )}
        </div>
      </div>
      <p className="text-sm text-zinc-500 mt-1 truncate">
        {game.opponentName ? `vs ${game.opponentName}` : game.location}
      </p>
      <p className="text-xs text-zinc-400 mt-1">
        {game.opponentName && `${game.location} ・ `}
        開始 {game.startTime}
        {game.capacity != null && ` ・ 定員 ${game.capacity}人`}
      </p>
    </>
  )

  const className = `block bg-white border border-zinc-200 rounded-xl p-4 ${
    canLink ? "hover:border-zinc-300 transition-colors" : ""
  } ${past ? "opacity-70" : ""}`

  return (
    <li>
      {canLink ? (
        <Link href={`/teams/${teamId}/games/${game.id}`} className={className}>
          {content}
        </Link>
      ) : (
        <div className={className}>{content}</div>
      )}
    </li>
  )
}
