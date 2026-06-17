// 出欠機能の共有ロジックと表示メタデータ
// API ルート・Server Component・Client Component の三者から利用するため
// サーバー専用 import を持たない（@prisma/client は型のみ import で安全）
import type { AttendanceStatus } from "@prisma/client"

// 回答可能なステータス（DB の enum と一致させる）
export const ATTENDANCE_STATUSES = ["ATTENDING", "ABSENT", "UNDECIDED"] as const

export type AttendanceStatusValue = (typeof ATTENDANCE_STATUSES)[number]

// 各ステータスの表示用ラベルと絵文字
export const ATTENDANCE_META: Record<
  AttendanceStatusValue,
  { label: string; emoji: string }
> = {
  ATTENDING: { label: "参加", emoji: "✅" },
  ABSENT: { label: "欠席", emoji: "❌" },
  UNDECIDED: { label: "未定", emoji: "❓" },
}

// API 入力が有効な出欠ステータスかを判定する型ガード
export function isAttendanceStatus(value: unknown): value is AttendanceStatusValue {
  return (
    typeof value === "string" &&
    (ATTENDANCE_STATUSES as readonly string[]).includes(value)
  )
}

// AttendanceStatus（Prisma enum）と AttendanceStatusValue は同じ文字列集合。
// 型の互換性を明示するためのヘルパ。
export function toStatusValue(status: AttendanceStatus): AttendanceStatusValue {
  return status as AttendanceStatusValue
}
