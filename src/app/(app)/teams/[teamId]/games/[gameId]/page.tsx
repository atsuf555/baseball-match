import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getMembership } from "@/lib/teams"
import { formatGameDateTime } from "@/lib/utils"
import {
  ATTENDANCE_META,
  ATTENDANCE_STATUSES,
  type AttendanceStatusValue,
} from "@/lib/attendance"
import { notFound } from "next/navigation"
import Link from "next/link"
import { AttendancePanel } from "./AttendancePanel"
import { HelperRequestsPanel } from "./HelperRequestsPanel"

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
    include: {
      team: { select: { id: true, name: true } },
      attendances: {
        select: { userId: true, status: true },
      },
      helperRequests: {
        include: {
          applications: { include: { user: { select: { name: true, email: true } } } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  })
  // 試合が存在しない／別チームの試合を指している場合は 404
  if (!game || game.teamId !== teamId) {
    notFound()
  }

  // チーム全員（名簿）を取得し、回答済みと突き合わせて「未回答」を割り出す
  const members = await prisma.teamMember.findMany({
    where: { teamId },
    select: { userId: true, user: { select: { name: true, email: true } } },
    orderBy: { joinedAt: "asc" },
  })

  // userId → 回答ステータスの対応表
  const statusByUser = new Map<string, AttendanceStatusValue>(
    game.attendances.map((a) => [a.userId, a.status as AttendanceStatusValue])
  )

  // 自分の現在の回答（未回答なら null）
  const myStatus = statusByUser.get(session!.user.id) ?? null

  // ステータスごとにメンバーを振り分ける（未回答は status: null のグループ）
  type RosterEntry = { name: string; status: AttendanceStatusValue | null }
  const roster: RosterEntry[] = members.map((m) => ({
    name: m.user.name ?? m.user.email ?? "名前未設定",
    status: statusByUser.get(m.userId) ?? null,
  }))

  // 集計：参加・欠席・未定・未回答の人数
  const counts = {
    ATTENDING: roster.filter((r) => r.status === "ATTENDING").length,
    ABSENT: roster.filter((r) => r.status === "ABSENT").length,
    UNDECIDED: roster.filter((r) => r.status === "UNDECIDED").length,
    UNANSWERED: roster.filter((r) => r.status === null).length,
  }

  const isAdmin = membership.role === "ADMIN"

  // リクエストごとに実行される動的 Server Component なので現在時刻の参照は妥当
  // eslint-disable-next-line react-hooks/purity
  const isPast = game.startsAt.getTime() < Date.now()

  const details: { label: string; value: string }[] = [
    { label: "試合日時", value: formatGameDateTime(game.startsAt) },
    { label: "試合開始時間", value: game.startTime },
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

        {/* 自分の出欠回答（楽観的更新つきボタン） */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <AttendancePanel gameId={game.id} initialStatus={myStatus} />
        </div>

        {/* 出欠サマリー（全員が見られる） */}
        <section>
          <h3 className="text-sm font-semibold text-zinc-900 mb-2">出欠状況</h3>
          <div className="grid grid-cols-4 gap-2">
            {(["ATTENDING", "ABSENT", "UNDECIDED"] as const).map((value) => (
              <div
                key={value}
                className="bg-white border border-zinc-200 rounded-xl py-3 text-center"
              >
                <p className="text-xl font-bold text-zinc-900 leading-none">
                  {counts[value]}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {ATTENDANCE_META[value].emoji} {ATTENDANCE_META[value].label}
                </p>
              </div>
            ))}
            <div className="bg-white border border-zinc-200 rounded-xl py-3 text-center">
              <p className="text-xl font-bold text-zinc-900 leading-none">
                {counts.UNANSWERED}
              </p>
              <p className="mt-1 text-xs text-zinc-500">⬜️ 未回答</p>
            </div>
          </div>
        </section>

        {/* 管理者向け：誰がどの回答かの名簿 */}
        {isAdmin && (
          <section>
            <h3 className="text-sm font-semibold text-zinc-900 mb-2">
              メンバー別の回答
            </h3>
            <div className="bg-white border border-zinc-200 rounded-xl divide-y divide-zinc-100">
              {/* 参加→欠席→未定→未回答 の順でグループ表示 */}
              {([...ATTENDANCE_STATUSES, null] as const).map((group) => {
                const entries = roster.filter((r) => r.status === group)
                if (entries.length === 0) return null
                const meta = group
                  ? ATTENDANCE_META[group]
                  : { label: "未回答", emoji: "⬜️" }
                return (
                  <div key={group ?? "none"} className="px-4 py-3">
                    <p className="text-xs font-medium text-zinc-400 mb-1.5">
                      {meta.emoji} {meta.label}（{entries.length}）
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {entries.map((e, i) => (
                        <span
                          key={`${group ?? "none"}-${i}`}
                          className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-1 text-sm text-zinc-700"
                        >
                          {e.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* 管理者向け：助っ人募集の作成・応募者確認・締め切り */}
        {isAdmin && (
          <HelperRequestsPanel
            gameId={game.id}
            initialRequests={game.helperRequests.map((r) => ({
              id: r.id,
              positions: r.positions,
              capacity: r.capacity,
              note: r.note,
              status: r.status,
              applicants: r.applications.map((a) => ({
                name: a.user.name ?? a.user.email ?? "名前未設定",
              })),
            }))}
          />
        )}
      </main>
    </div>
  )
}
