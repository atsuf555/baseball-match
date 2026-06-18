import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getMembership } from "@/lib/teams"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { EditTeamForm } from "./EditTeamForm"

export default async function EditTeamPage({
  params,
}: PageProps<"/teams/[teamId]/edit">) {
  const { teamId } = await params
  const session = await auth()

  const membership = await getMembership(teamId, session!.user.id)
  if (!membership) {
    notFound()
  }
  if (membership.role !== "ADMIN") {
    redirect(`/teams/${teamId}`)
  }

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { twitterUrl: true, instagramUrl: true, contactEmail: true },
  })
  if (!team) {
    notFound()
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
        <h1 className="font-semibold text-zinc-900">連絡先の編集</h1>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <EditTeamForm teamId={teamId} initial={team} />
      </main>
    </div>
  )
}
