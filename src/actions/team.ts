"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateInviteCode } from "@/lib/utils"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export type TeamActionState = {
  ok: boolean
  error: string
}

export async function createTeam(
  prevState: TeamActionState,
  formData: FormData
): Promise<TeamActionState> {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: "ログインが必要です" }
  }

  const name = (formData.get("name") as string | null)?.trim()
  const description = (formData.get("description") as string | null)?.trim() || null

  if (!name) {
    return { ok: false, error: "チーム名を入力してください" }
  }
  if (name.length > 50) {
    return { ok: false, error: "チーム名は50文字以内で入力してください" }
  }
  if (description && description.length > 200) {
    return { ok: false, error: "説明は200文字以内で入力してください" }
  }

  // 招待コード衝突の場合は再生成（確率は約1/21億だが念のため）
  let inviteCode = generateInviteCode()
  const duplicate = await prisma.team.findUnique({ where: { inviteCode } })
  if (duplicate) {
    inviteCode = generateInviteCode()
  }

  await prisma.team.create({
    data: {
      name,
      description,
      inviteCode,
      createdById: session.user.id,
      members: {
        create: {
          userId: session.user.id,
          role: "ADMIN",
        },
      },
    },
  })

  revalidatePath("/dashboard")
  redirect("/dashboard")
}
