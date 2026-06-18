import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { GroundsList } from "./GroundsList"

// グラウンド譲渡の公開一覧。ログイン不要で閲覧できる
export default async function GroundOffersPage() {
  const offers = await prisma.groundOffer.findMany({
    include: {
      team: { select: { name: true } },
    },
    orderBy: [{ status: "asc" }, { date: "asc" }],
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
        <h1 className="font-semibold text-zinc-900 truncate">グラウンド譲渡</h1>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <GroundsList
          offers={offers.map((o) => ({
            id: o.id,
            teamName: o.team.name,
            prefecture: o.prefecture,
            groundName: o.groundName,
            location: o.location,
            date: o.date,
            capacity: o.capacity,
            note: o.note,
            status: o.status,
          }))}
        />
      </main>
    </div>
  )
}
