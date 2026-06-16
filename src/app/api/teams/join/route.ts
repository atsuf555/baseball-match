import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { normalizeInviteCode } from "@/lib/utils"
import { revalidatePath } from "next/cache"

// POST /api/teams/join
// 招待コードでチームに参加する
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "ログインが必要です" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "リクエストの形式が不正です" }, { status: 400 })
  }

  const rawCode =
    typeof body === "object" && body !== null && "inviteCode" in body
      ? (body as { inviteCode?: unknown }).inviteCode
      : undefined

  if (typeof rawCode !== "string" || rawCode.trim() === "") {
    return Response.json(
      { error: "招待コードを入力してください" },
      { status: 400 }
    )
  }

  const inviteCode = normalizeInviteCode(rawCode)

  const team = await prisma.team.findUnique({
    where: { inviteCode },
    select: { id: true },
  })
  if (!team) {
    return Response.json(
      { error: "招待コードが正しくありません" },
      { status: 404 }
    )
  }

  const existing = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId: team.id, userId: session.user.id } },
    select: { id: true },
  })
  if (existing) {
    return Response.json(
      { error: "すでにこのチームに参加しています", teamId: team.id },
      { status: 409 }
    )
  }

  await prisma.teamMember.create({
    data: {
      teamId: team.id,
      userId: session.user.id,
      role: "PLAYER",
    },
  })

  revalidatePath("/dashboard")
  revalidatePath(`/teams/${team.id}`)

  return Response.json({ ok: true, teamId: team.id }, { status: 201 })
}
