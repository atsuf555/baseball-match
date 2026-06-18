import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getMembership } from "@/lib/teams"
import { revalidatePath } from "next/cache"

// PATCH /api/teams/[teamId]/member-requests/[requestId]
// メンバー募集を締め切る（チームの管理者のみ）
export async function PATCH(
  request: Request,
  { params }: RouteContext<"/api/teams/[teamId]/member-requests/[requestId]">
) {
  const { teamId, requestId } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "ログインが必要です" }, { status: 401 })
  }

  const memberRequest = await prisma.memberRequest.findUnique({
    where: { id: requestId },
    select: { id: true, teamId: true },
  })
  if (!memberRequest || memberRequest.teamId !== teamId) {
    return Response.json({ error: "メンバー募集が見つかりません" }, { status: 404 })
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
      { error: "募集を締め切れるのは管理者のみです" },
      { status: 403 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "リクエストの形式が不正です" }, { status: 400 })
  }

  // 現時点でサポートする更新は「締め切り」のみ
  const status = (body as Record<string, unknown> | null)?.status
  if (status !== "CLOSED") {
    return Response.json({ error: "指定された更新内容は不正です" }, { status: 400 })
  }

  const updated = await prisma.memberRequest.update({
    where: { id: requestId },
    data: { status: "CLOSED" },
    select: { status: true },
  })

  revalidatePath(`/teams/${teamId}`)
  revalidatePath("/members")

  return Response.json({ ok: true, status: updated.status })
}
