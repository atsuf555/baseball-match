import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getMembership } from "@/lib/teams"
import { revalidatePath } from "next/cache"

// PATCH /api/games/[gameId]/helper-requests/[requestId]
// 助っ人募集を締め切る（試合が属するチームの管理者のみ）
export async function PATCH(
  request: Request,
  { params }: RouteContext<"/api/games/[gameId]/helper-requests/[requestId]">
) {
  const { gameId, requestId } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "ログインが必要です" }, { status: 401 })
  }

  const helperRequest = await prisma.helperRequest.findUnique({
    where: { id: requestId },
    select: { id: true, gameId: true, game: { select: { teamId: true } } },
  })
  if (!helperRequest || helperRequest.gameId !== gameId) {
    return Response.json({ error: "助っ人募集が見つかりません" }, { status: 404 })
  }

  const membership = await getMembership(
    helperRequest.game.teamId,
    session.user.id
  )
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

  const updated = await prisma.helperRequest.update({
    where: { id: requestId },
    data: { status: "CLOSED" },
    select: { status: true },
  })

  revalidatePath(`/teams/${helperRequest.game.teamId}/games/${gameId}`)
  revalidatePath("/helpers")

  return Response.json({ ok: true, status: updated.status })
}
