import { prisma } from "@/lib/prisma"
import { formatGameDateTime } from "@/lib/utils"
import { notFound } from "next/navigation"
import Link from "next/link"

// グラウンド譲渡の詳細ページ。ログイン不要で閲覧でき、連絡先メールアドレスへの問い合わせを促す
export default async function GroundOfferDetailPage({
  params,
}: PageProps<"/grounds/[id]">) {
  const { id } = await params

  const groundOffer = await prisma.groundOffer.findUnique({
    where: { id },
    include: {
      team: { select: { name: true } },
    },
  })
  if (!groundOffer) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Link
          href="/grounds"
          className="text-zinc-500 hover:text-zinc-700 transition-colors p-1 -ml-1"
          aria-label="戻る"
        >
          ←
        </Link>
        <h1 className="font-semibold text-zinc-900 truncate">グラウンド譲渡の詳細</h1>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <section className="bg-white border border-zinc-200 rounded-xl p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs text-zinc-400">{groundOffer.team.name}</p>
              <h2 className="text-lg font-bold text-zinc-900 mt-0.5">
                {groundOffer.groundName}
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">📍 {groundOffer.prefecture}</p>
            </div>
            <span
              className={`shrink-0 text-xs px-1.5 py-0.5 rounded font-medium ${
                groundOffer.status === "OPEN"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-zinc-100 text-zinc-500"
              }`}
            >
              {groundOffer.status === "OPEN" ? "募集中" : "募集終了"}
            </span>
          </div>

          <dl className="mt-4 divide-y divide-zinc-100 border-t border-zinc-100">
            <div className="flex items-start gap-4 py-3">
              <dt className="text-sm text-zinc-400 w-24 shrink-0">場所・住所</dt>
              <dd className="text-sm text-zinc-900 font-medium flex-1 min-w-0">
                {groundOffer.location}
              </dd>
            </div>
            <div className="flex items-start gap-4 py-3">
              <dt className="text-sm text-zinc-400 w-24 shrink-0">譲渡希望日時</dt>
              <dd className="text-sm text-zinc-900 font-medium flex-1 min-w-0">
                {formatGameDateTime(groundOffer.date)}
              </dd>
            </div>
            {groundOffer.capacity != null && (
              <div className="flex items-start gap-4 py-3">
                <dt className="text-sm text-zinc-400 w-24 shrink-0">収容人数</dt>
                <dd className="text-sm text-zinc-900 font-medium flex-1 min-w-0">
                  {groundOffer.capacity}人
                </dd>
              </div>
            )}
            {groundOffer.note && (
              <div className="flex items-start gap-4 py-3">
                <dt className="text-sm text-zinc-400 w-24 shrink-0">メモ</dt>
                <dd className="text-sm text-zinc-700 flex-1 min-w-0 whitespace-pre-wrap">
                  {groundOffer.note}
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
            href={`mailto:${groundOffer.contactEmail}`}
            className="inline-flex items-center justify-center w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors"
          >
            メールで問い合わせる
          </a>
        </section>
      </main>
    </div>
  )
}
