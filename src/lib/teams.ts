import { prisma } from "@/lib/prisma"
import type { TeamRole } from "@prisma/client"

// 指定ユーザーのチーム内メンバーシップ（役割）を取得する
// 所属していなければ null を返す。ページ・API の双方でアクセス制御に使用する
export function getMembership(
  teamId: string,
  userId: string
): Promise<{ role: TeamRole } | null> {
  return prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
    select: { role: true },
  })
}
