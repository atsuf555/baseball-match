import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { CopyButton } from "@/components/CopyButton"

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
