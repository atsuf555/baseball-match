import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getMembership } from "@/lib/teams"
import { validateHelperRequestInput } from "@/lib/helperRequests"
import { revalidatePath } from "next/cache"

// POST /api/games/[gameId]/helper-requests
// 助っ人募集を作成する（試合が属するチームの管理者のみ）
export async function POST(
  request: Request,
  { params }: RouteContext<"/api/games/[gameId]/helper-requests">
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
      { error: "助っ人募集を作成できるのは管理者のみです" },
      { status: 403 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "リクエストの形式が不正です" }, { status: 400 })
  }

  const result = validateHelperRequestInput(body)
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 400 })
  }

  const helperRequest = await prisma.helperRequest.create({
    data: {
      gameId,
      createdById: session.user.id,
      positions: result.value.positions,
      capacity: result.value.capacity,
      note: result.value.note,
    },
  })

  // 管理者の募集一覧と公開一覧（/helpers）を最新化する
  revalidatePath(`/teams/${game.teamId}/games/${gameId}`)
  revalidatePath("/helpers")

  return Response.json({ ok: true, requestId: helperRequest.id }, { status: 201 })
}
