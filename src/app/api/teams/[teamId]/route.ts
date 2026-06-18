import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getMembership } from "@/lib/teams"
import { validateTeamContactInput } from "@/lib/teamContact"
import { revalidatePath } from "next/cache"

// PATCH /api/teams/[teamId]
// チームの連絡先情報を更新する（管理者のみ）
export async function PATCH(
  request: Request,
  { params }: RouteContext<"/api/teams/[teamId]">
) {
  const { teamId } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "ログインが必要です" }, { status: 401 })
  }

  const membership = await getMembership(teamId, session.user.id)
  if (!membership) {
    return Response.json(
      { error: "このチームのメンバーではありません" },
      { status: 403 }
    )
  }
  if (membership.role !== "ADMIN") {
    return Response.json(
      { error: "連絡先を編集できるのは管理者のみです" },
      { status: 403 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "リクエストの形式が不正です" }, { status: 400 })
  }

  const result = validateTeamContactInput(body)
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 400 })
  }

  await prisma.team.update({
    where: { id: teamId },
    data: {
      twitterUrl: result.value.twitterUrl,
      instagramUrl: result.value.instagramUrl,
      contactEmail: result.value.contactEmail,
    },
  })

  revalidatePath(`/teams/${teamId}`)

  return Response.json({ ok: true }, { status: 200 })
}
