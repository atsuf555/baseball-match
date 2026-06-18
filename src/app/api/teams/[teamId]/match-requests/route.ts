import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getMembership } from "@/lib/teams"
import { validateMatchRequestInput } from "@/lib/matchRequests"
import { revalidatePath } from "next/cache"

// POST /api/teams/[teamId]/match-requests
// 対戦相手募集を作成する（チームの管理者のみ）
export async function POST(
  request: Request,
  { params }: RouteContext<"/api/teams/[teamId]/match-requests">
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
      { error: "対戦相手募集を作成できるのは管理者のみです" },
      { status: 403 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "リクエストの形式が不正です" }, { status: 400 })
  }

  const result = validateMatchRequestInput(body)
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 400 })
  }

  const matchRequest = await prisma.matchRequest.create({
    data: {
      teamId,
      createdById: session.user.id,
      date: result.value.date,
      location: result.value.location,
      level: result.value.level,
      memberCount: result.value.memberCount,
      note: result.value.note,
      contactEmail: result.value.contactEmail,
    },
  })

  // 管理者の一覧と公開一覧（/matches）を最新化する
  revalidatePath(`/teams/${teamId}`)
  revalidatePath("/matches")

  return Response.json({ ok: true, requestId: matchRequest.id }, { status: 201 })
}
