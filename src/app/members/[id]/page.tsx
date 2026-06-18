import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"

// メンバー募集の詳細ページ。ログイン不要で閲覧でき、連絡先メールアドレスへの問い合わせを促す
export default async function MemberRequestDetailPage({
  params,
}: PageProps<"/members/[id]">) {
  const { id } = await params

  const memberRequest = await prisma.memberRequest.findUnique({
    where: { id },
    include: {
      team: { select: { name: true } },
    },
  })
  if (!memberRequest) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Link
          href="/members"
          className="text-zinc-500 hover:text-zinc-700 transition-colors p-1 -ml-1"
          aria-label="戻る"
        >
          ←
        </Link>
        <h1 className="font-semibold text-zinc-900 truncate">メンバー募集の詳細</h1>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <section className="bg-white border border-zinc-200 rounded-xl p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs text-zinc-400">{memberRequest.team.name}</p>
              {memberRequest.level && (
                <h2 className="text-lg font-bold text-zinc-900 mt-0.5">
                  {memberRequest.level}
                </h2>
              )}
            </div>
            <span
              className={`shrink-0 text-xs px-1.5 py-0.5 rounded font-medium ${
                memberRequest.status === "OPEN"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-zinc-100 text-zinc-500"
              }`}
            >
              {memberRequest.status === "OPEN" ? "募集中" : "募集終了"}
            </span>
          </div>

          <dl className="mt-4 divide-y divide-zinc-100 border-t border-zinc-100">
            <div className="flex items-start gap-4 py-3">
              <dt className="text-sm text-zinc-400 w-24 shrink-0">募集ポジション</dt>
              <dd className="text-sm text-zinc-900 font-medium flex-1 min-w-0">
                {memberRequest.positions ?? "指定なし"}
              </dd>
            </div>
            <div className="flex items-start gap-4 py-3">
              <dt className="text-sm text-zinc-400 w-24 shrink-0">募集人数</dt>
              <dd className="text-sm text-zinc-900 font-medium flex-1 min-w-0">
                {memberRequest.count}人
              </dd>
            </div>
            {memberRequest.level && (
              <div className="flex items-start gap-4 py-3">
                <dt className="text-sm text-zinc-400 w-24 shrink-0">レベル感</dt>
                <dd className="text-sm text-zinc-900 font-medium flex-1 min-w-0">
                  {memberRequest.level}
                </dd>
              </div>
            )}
            {memberRequest.note && (
              <div className="flex items-start gap-4 py-3">
                <dt className="text-sm text-zinc-400 w-24 shrink-0">メモ</dt>
                <dd className="text-sm text-zinc-700 flex-1 min-w-0 whitespace-pre-wrap">
                  {memberRequest.note}
                </dd>
              </div>
            )}
          </dl>
        </section>

        <section className="bg-white border border-zinc-200 rounded-xl p-5 text-center">
          <p className="text-sm text-zinc-700 mb-3">
            興味がある方はこちらまでご連絡ください
          </p>
          <a
            href={`mailto:${memberRequest.contactEmail}`}
            className="inline-flex items-center justify-center w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors"
          >
            メールで問い合わせる
          </a>
        </section>
      </main>
    </div>
  )
}
