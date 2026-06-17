import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getMembership } from "@/lib/teams"
import { isAttendanceStatus } from "@/lib/attendance"
import { revalidatePath } from "next/cache"

// POST /api/games/[gameId]/attendance
// 自分の出欠回答を登録・更新する（チームメンバーのみ）
export async function POST(
  request: Request,
  { params }: RouteContext<"/api/games/[gameId]/attendance">
) {
  const { gameId } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "ログインが必要です" }, { status: 401 })
  }

  // 試合の存在確認と所属チームの特定
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: { id: true, teamId: true },
  })
  if (!game) {
    return Response.json({ error: "試合が見つかりません" }, { status: 404 })
  }

  // チームメンバー以外は回答できない
  const membership = await getMembership(game.teamId, session.user.id)
  if (!membership) {
    return Response.json(
      { error: "このチームのメンバーではありません" },
      { status: 403 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "リクエストの形式が不正です" }, { status: 400 })
  }

  const status = (body as Record<string, unknown> | null)?.status
  if (!isAttendanceStatus(status)) {
    return Response.json({ error: "出欠の値が不正です" }, { status: 400 })
  }

  // 1試合1ユーザー1件（gameId + userId が一意）なので upsert で登録・更新を兼ねる
  const attendance = await prisma.attendance.upsert({
    where: { gameId_userId: { gameId, userId: session.user.id } },
    create: { gameId, userId: session.user.id, status },
    update: { status },
    select: { status: true },
  })

  // 管理者の出欠一覧・集計を最新化する
  revalidatePath(`/teams/${game.teamId}/games/${gameId}`)

  return Response.json({ ok: true, status: attendance.status })
}
