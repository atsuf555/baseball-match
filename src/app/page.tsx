import { auth, signIn } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { RecruitmentBoard, type RecruitmentCard } from "@/components/RecruitmentBoard"
import { AppHeader } from "@/components/AppHeader"

// DB から最新の募集一覧を取得して表示するため、静的プリレンダーを無効化する
export const dynamic = "force-dynamic"

// トップページ。ログイン不要で募集掲示板（現時点では助っ人募集）を公開する。
// ログイン済みユーザーは middleware により /dashboard にリダイレクトされるため、
// ここは実質的に未ログインの訪問者向けのページとして機能する。
export default async function LandingPage() {
  const session = await auth()

  // リクエストごとに実行される動的 Server Component なので現在時刻の参照は妥当
  const now = new Date()

  const helperRequests = await prisma.helperRequest.findMany({
    where: { game: { startsAt: { gte: now } } },
    include: {
      game: {
        select: {
          startsAt: true,
          location: true,
          team: { select: { name: true } },
        },
      },
    },
    orderBy: [{ status: "asc" }, { game: { startsAt: "asc" } }],
  })

  const memberRequests = await prisma.memberRequest.findMany({
    include: {
      team: { select: { name: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  })

  const matchRequests = await prisma.matchRequest.findMany({
    include: {
      team: { select: { name: true } },
    },
    orderBy: [{ status: "asc" }, { date: "asc" }],
  })

  const groundOffers = await prisma.groundOffer.findMany({
    include: {
      team: { select: { name: true } },
    },
    orderBy: [{ status: "asc" }, { date: "asc" }],
  })

  // 各カテゴリの募集を募集カードの共通形式に変換する
  // （将来カテゴリを追加する際は、ここに同様の変換処理を加えていく）
  const cards: RecruitmentCard[] = [
    ...helperRequests.map((r): RecruitmentCard => ({
      id: r.id,
      category: "helper",
      teamName: r.game.team.name,
      prefecture: r.prefecture,
      startsAt: r.game.startsAt,
      location: r.game.location,
      positions: r.positions,
      count: r.count,
      note: r.note,
      status: r.status,
    })),
    ...memberRequests.map((r): RecruitmentCard => ({
      id: r.id,
      category: "member",
      teamName: r.team.name,
      prefecture: r.prefecture,
      positions: r.positions,
      count: r.count,
      level: r.level,
      note: r.note,
      status: r.status,
    })),
    ...matchRequests.map((r): RecruitmentCard => ({
      id: r.id,
      category: "match",
      teamName: r.team.name,
      prefecture: r.prefecture,
      date: r.date,
      location: r.location,
      level: r.level,
      memberCount: r.memberCount,
      note: r.note,
      status: r.status,
    })),
    ...groundOffers.map((o): RecruitmentCard => ({
      id: o.id,
      category: "ground",
      teamName: o.team.name,
      prefecture: o.prefecture,
      groundName: o.groundName,
      location: o.location,
      date: o.date,
      capacity: o.capacity,
      note: o.note,
      status: o.status,
    })),
  ]

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* ヘッダー：ログイン済みなら共通ナビ、未ログインならログイン誘導 */}
      {session ? (
        <AppHeader userImage={session.user.image} userName={session.user.name} />
      ) : (
        <header className="bg-white border-b border-zinc-200">
          <div className="max-w-lg mx-auto px-4 py-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="inline-flex items-center justify-center w-11 h-11 bg-blue-600 rounded-2xl shrink-0">
                <span className="text-white text-xl font-bold">B</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-zinc-900">BaseHub</h1>
                <p className="text-zinc-500 text-sm">草野球チームの出欠管理をシンプルに</p>
              </div>
            </div>

            <form
              action={async () => {
                "use server"
                await signIn("google", { redirectTo: "/dashboard" })
              }}
            >
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-3 bg-white border border-zinc-300 rounded-xl py-3 px-4 text-zinc-700 font-medium text-sm hover:bg-zinc-50 transition-colors shadow-sm"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Googleでログイン
              </button>
            </form>
          </div>
        </header>
      )}

      <main className="max-w-lg mx-auto px-4 py-6 space-y-8">
        {/* 募集掲示板（助っ人募集・将来は対戦相手募集等も追加） */}
        <RecruitmentBoard cards={cards} />
      </main>
    </div>
  )
}
