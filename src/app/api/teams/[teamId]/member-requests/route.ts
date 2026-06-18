import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getMembership } from "@/lib/teams"
import { validateMemberRequestInput } from "@/lib/memberRequests"
import { revalidatePath } from "next/cache"

// POST /api/teams/[teamId]/member-requests
// メンバー募集を作成する（チームの管理者のみ）
export async function POST(
  request: Request,
  { params }: RouteContext<"/api/teams/[teamId]/member-requests">
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
      { error: "メンバー募集を作成できるのは管理者のみです" },
      { status: 403 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "リクエストの形式が不正です" }, { status: 400 })
  }

  const result = validateMemberRequestInput(body)
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 400 })
  }

  const memberRequest = await prisma.memberRequest.create({
    data: {
      teamId,
      createdById: session.user.id,
      positions: result.value.positions,
      count: result.value.count,
      level: result.value.level,
      note: result.value.note,
      contactEmail: result.value.contactEmail,
    },
  })

  // 管理者の募集一覧と公開一覧（/members）を最新化する
  revalidatePath(`/teams/${teamId}`)
  revalidatePath("/members")

  return Response.json({ ok: true, requestId: memberRequest.id }, { status: 201 })
}
