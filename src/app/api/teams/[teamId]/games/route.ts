import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getMembership } from "@/lib/teams"
import { validateGameInput } from "@/lib/games"
import { revalidatePath } from "next/cache"

// GET /api/teams/[teamId]/games
// チームに紐づく試合一覧を取得する（メンバーのみ）
export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/teams/[teamId]/games">
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

  const games = await prisma.game.findMany({
    where: { teamId },
    orderBy: { startsAt: "asc" },
  })

  return Response.json({ games })
}

// POST /api/teams/[teamId]/games
// 試合を作成する（管理者のみ）
export async function POST(
  request: Request,
  { params }: RouteContext<"/api/teams/[teamId]/games">
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
      { error: "試合を作成できるのは管理者のみです" },
      { status: 403 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "リクエストの形式が不正です" }, { status: 400 })
  }

  const result = validateGameInput(body)
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 400 })
  }

  const game = await prisma.game.create({
    data: {
      teamId,
      createdById: session.user.id,
      startsAt: result.value.startsAt,
      location: result.value.location,
      meetTime: result.value.meetTime,
      capacity: result.value.capacity,
      note: result.value.note,
    },
  })

  revalidatePath(`/teams/${teamId}`)

  return Response.json({ ok: true, gameId: game.id }, { status: 201 })
}
