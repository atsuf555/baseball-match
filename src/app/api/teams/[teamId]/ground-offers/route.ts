import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getMembership } from "@/lib/teams"
import { validateGroundOfferInput } from "@/lib/groundOffers"
import { revalidatePath } from "next/cache"

// POST /api/teams/[teamId]/ground-offers
// グラウンド譲渡を作成する（チームの管理者のみ）
export async function POST(
  request: Request,
  { params }: RouteContext<"/api/teams/[teamId]/ground-offers">
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
      { error: "グラウンド譲渡を作成できるのは管理者のみです" },
      { status: 403 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "リクエストの形式が不正です" }, { status: 400 })
  }

  const result = validateGroundOfferInput(body)
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 400 })
  }

  const groundOffer = await prisma.groundOffer.create({
    data: {
      teamId,
      createdById: session.user.id,
      groundName: result.value.groundName,
      location: result.value.location,
      date: result.value.date,
      capacity: result.value.capacity,
      note: result.value.note,
      contactEmail: result.value.contactEmail,
      prefecture: result.value.prefecture,
    },
  })

  // 管理者の一覧と公開一覧（/grounds）を最新化する
  revalidatePath(`/teams/${teamId}`)
  revalidatePath("/grounds")

  return Response.json({ ok: true, requestId: groundOffer.id }, { status: 201 })
}
