import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getMembership } from "@/lib/teams"
import { revalidatePath } from "next/cache"

// POST /api/games/[gameId]/helper-requests/[requestId]/apply
// 助っ人募集に応募する（ログイン必須・自チームのメンバーは応募不可）
export async function POST(
  _request: Request,
  {
    params,
  }: RouteContext<"/api/games/[gameId]/helper-requests/[requestId]/apply">
) {
  const { gameId, requestId } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "ログインが必要です" }, { status: 401 })
  }

  const helperRequest = await prisma.helperRequest.findUnique({
    where: { id: requestId },
    select: { id: true, gameId: true, status: true, game: { select: { teamId: true } } },
  })
  if (!helperRequest || helperRequest.gameId !== gameId) {
    return Response.json({ error: "助っ人募集が見つかりません" }, { status: 404 })
  }

  if (helperRequest.status === "CLOSED") {
    return Response.json({ error: "この募集は終了しています" }, { status: 400 })
  }

  // 自チームのメンバーは応募不要（出欠で参加できるため）
  const membership = await getMembership(
    helperRequest.game.teamId,
    session.user.id
  )
  if (membership) {
    return Response.json(
      { error: "チームメンバーは応募できません" },
      { status: 403 }
    )
  }

  // 連打や再応募でも壊れないよう、既存の応募があればそのまま成功扱いにする
  await prisma.helperApplication.upsert({
    where: { helperRequestId_userId: { helperRequestId: requestId, userId: session.user.id } },
    create: { helperRequestId: requestId, userId: session.user.id },
    update: {},
  })

  revalidatePath("/helpers")
  revalidatePath(`/teams/${helperRequest.game.teamId}/games/${gameId}`)

  return Response.json({ ok: true, applied: true })
}
