import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getMembership } from "@/lib/teams"
import { validateGameResultInput } from "@/lib/gameResult"
import { revalidatePath } from "next/cache"

// PATCH /api/games/[gameId]/result
// 試合結果を登録・更新する（試合が属するチームの管理者のみ）
export async function PATCH(
  request: Request,
  { params }: RouteContext<"/api/games/[gameId]/result">
) {
  const { gameId } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "ログインが必要です" }, { status: 401 })
  }

  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: { id: true, teamId: true },
  })
  if (!game) {
    return Response.json({ error: "試合が見つかりません" }, { status: 404 })
  }

  const membership = await getMembership(game.teamId, session.user.id)
  if (!membership) {
    return Response.json(
      { error: "このチームのメンバーではありません" },
      { status: 403 }
    )
  }
  if (membership.role !== "ADMIN") {
    return Response.json(
      { error: "試合結果を登録できるのは管理者のみです" },
      { status: 403 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "リクエストの形式が不正です" }, { status: 400 })
  }

  const result = validateGameResultInput(body)
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 400 })
  }

  await prisma.game.update({
    where: { id: gameId },
    data: {
      opponentName: result.value.opponentName,
      ourScore: result.value.ourScore,
      opponentScore: result.value.opponentScore,
      tournamentName: result.value.tournamentName,
      summary: result.value.summary,
      result: result.value.result,
    },
  })

  revalidatePath(`/teams/${game.teamId}/games/${gameId}`)
  revalidatePath(`/teams/${game.teamId}`)

  return Response.json({ ok: true, result: result.value.result }, { status: 200 })
}
