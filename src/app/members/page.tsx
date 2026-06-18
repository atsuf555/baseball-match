import { prisma } from "@/lib/prisma"
import Link from "next/link"

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
        {requests.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-xl p-8 text-center">
            <p className="text-sm text-zinc-400">
              現在募集中のメンバーはありません
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {requests.map((r) => (
              <li
                key={r.id}
                className="bg-white border border-zinc-200 rounded-xl p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-zinc-400">{r.team.name}</p>
                    {r.level && (
                      <h2 className="text-sm font-semibold text-zinc-900 mt-0.5">
                        {r.level}
                      </h2>
                    )}
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
                  <span className="text-zinc-400 ml-1.5">（募集 {r.count}人）</span>
                </p>

                {r.note && (
                  <p className="text-xs text-zinc-500 mt-1 whitespace-pre-wrap">
                    {r.note}
                  </p>
                )}

                <Link
                  href={`/members/${r.id}`}
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
