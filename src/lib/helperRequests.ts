// 助っ人募集の作成入力バリデーション（副作用なしの純粋関数）
// API ルートとユニットテストの双方から利用する

export type ValidatedHelperRequest = {
  positions: string | null
  capacity: number
  note: string | null
}

export type HelperRequestValidationResult =
  | { ok: true; value: ValidatedHelperRequest }
  | { ok: false; error: string }

const MAX_POSITIONS_LENGTH = 100
const MAX_NOTE_LENGTH = 500
const MAX_CAPACITY = 99

export function validateHelperRequestInput(
  body: unknown
): HelperRequestValidationResult {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "リクエストの形式が不正です" }
  }
  const data = body as Record<string, unknown>

  // 募集人数
  if (data.capacity === undefined || data.capacity === null || data.capacity === "") {
    return { ok: false, error: "募集人数を入力してください" }
  }
  const capacity =
    typeof data.capacity === "number" ? data.capacity : Number(data.capacity)
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > MAX_CAPACITY) {
    return {
      ok: false,
      error: `募集人数は1〜${MAX_CAPACITY}の整数で入力してください`,
    }
  }

  // ポジション（任意）
  let positions: string | null = null
  if (data.positions !== undefined && data.positions !== null) {
    if (typeof data.positions !== "string") {
      return { ok: false, error: "ポジションの形式が不正です" }
    }
    const trimmed = data.positions.trim()
    if (trimmed.length > MAX_POSITIONS_LENGTH) {
      return {
        ok: false,
        error: `ポジションは${MAX_POSITIONS_LENGTH}文字以内で入力してください`,
      }
    }
    positions = trimmed === "" ? null : trimmed
  }

  // メモ（任意）
  let note: string | null = null
  if (data.note !== undefined && data.note !== null) {
    if (typeof data.note !== "string") {
      return { ok: false, error: "メモの形式が不正です" }
    }
    const trimmed = data.note.trim()
    if (trimmed.length > MAX_NOTE_LENGTH) {
      return {
        ok: false,
        error: `メモは${MAX_NOTE_LENGTH}文字以内で入力してください`,
      }
    }
    note = trimmed === "" ? null : trimmed
  }

  return { ok: true, value: { positions, capacity, note } }
}
