import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { HelpersList } from "./HelpersList"

// 助っ人募集の公開一覧。ログイン不要で閲覧できる
export default async function HelpersPage() {
  // リクエストごとに実行される動的 Server Component なので現在時刻の参照は妥当
  const now = new Date()

  const requests = await prisma.helperRequest.findMany({
    where: { game: { startsAt: { gte: now } } },
    include: {
      game: {
        select: {
          id: true,
          startsAt: true,
          location: true,
          startTime: true,
          team: { select: { name: true } },
        },
      },
    },
    orderBy: [{ status: "asc" }, { game: { startsAt: "asc" } }],
  })

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
        <HelpersList
          requests={requests.map((r) => ({
            id: r.id,
            teamName: r.game.team.name,
            prefecture: r.prefecture,
            startsAt: r.game.startsAt,
            location: r.game.location,
            startTime: r.game.startTime,
            positions: r.positions,
            count: r.count,
            note: r.note,
            status: r.status,
          }))}
        />
      </main>
    </div>
  )
}
