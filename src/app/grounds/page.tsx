import { prisma } from "@/lib/prisma"
import { formatGameDateTime } from "@/lib/utils"
import Link from "next/link"

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
        {offers.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-xl p-8 text-center">
            <p className="text-sm text-zinc-400">
              現在譲渡情報はありません
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {offers.map((o) => (
              <li
                key={o.id}
                className="bg-white border border-zinc-200 rounded-xl p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-zinc-400">{o.team.name}</p>
                    <h2 className="text-sm font-semibold text-zinc-900 mt-0.5">
                      {o.groundName}
                    </h2>
                    <p className="text-sm text-zinc-500 mt-0.5">
                      {o.location} ・ {formatGameDateTime(o.date)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-xs px-1.5 py-0.5 rounded font-medium ${
                      o.status === "OPEN"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {o.status === "OPEN" ? "募集中" : "募集終了"}
                  </span>
                </div>

                {o.capacity != null && (
                  <p className="text-sm text-zinc-700 mt-3">
                    収容人数 {o.capacity}人
                  </p>
                )}

                {o.note && (
                  <p className="text-xs text-zinc-500 mt-1 whitespace-pre-wrap">
                    {o.note}
                  </p>
                )}

                <Link
                  href={`/grounds/${o.id}`}
                  className="inline-block text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors mt-3"
                >
                  詳細を見る
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
