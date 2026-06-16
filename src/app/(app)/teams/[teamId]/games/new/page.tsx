import { auth } from "@/lib/auth"
import { getMembership } from "@/lib/teams"
import { redirect } from "next/navigation"
import Link from "next/link"
import { NewGameForm } from "./NewGameForm"

export default async function NewGamePage({
  params,
}: PageProps<"/teams/[teamId]/games/new">) {
  const { teamId } = await params
  const session = await auth()

  // 管理者のみアクセス可。メンバー外・非管理者はチーム詳細へリダイレクト
  const membership = await getMembership(teamId, session!.user.id)
  if (!membership || membership.role !== "ADMIN") {
    redirect(`/teams/${teamId}`)
  }

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
        <h1 className="font-semibold text-zinc-900">試合を作成</h1>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <NewGameForm teamId={teamId} />
      </main>
    </div>
  )
}
