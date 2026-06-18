import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { MembersList } from "./MembersList"

// メンバー募集の公開一覧。ログイン不要で閲覧できる
export default async function MemberRequestsPage() {
  const requests = await prisma.memberRequest.findMany({
    include: {
      team: { select: { name: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
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
        <h1 className="font-semibold text-zinc-900 truncate">メンバー募集</h1>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <MembersList
          requests={requests.map((r) => ({
            id: r.id,
            teamName: r.team.name,
            prefecture: r.prefecture,
            positions: r.positions,
            count: r.count,
            level: r.level,
            note: r.note,
            status: r.status,
          }))}
        />
      </main>
    </div>
  )
}
