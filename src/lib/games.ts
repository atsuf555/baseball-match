// 試合作成の入力バリデーション（副作用なしの純粋関数）
// API ルートとユニットテストの双方から利用する

export type ValidatedGame = {
  startsAt: Date
  location: string
  meetTime: string
  capacity: number | null
  note: string | null
}

export type GameValidationResult =
  | { ok: true; value: ValidatedGame }
  | { ok: false; error: string }

const MEET_TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/ // "HH:mm" (00:00〜23:59)
const MAX_LOCATION_LENGTH = 100
const MAX_NOTE_LENGTH = 500
const MAX_CAPACITY = 999

export function validateGameInput(body: unknown): GameValidationResult {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "リクエストの形式が不正です" }
  }
  const data = body as Record<string, unknown>

  // 試合日時
  if (typeof data.startsAt !== "string" || data.startsAt.trim() === "") {
    return { ok: false, error: "試合日時を入力してください" }
  }
  const startsAt = new Date(data.startsAt)
  if (Number.isNaN(startsAt.getTime())) {
    return { ok: false, error: "試合日時を正しく入力してください" }
  }

  // 場所
  if (typeof data.location !== "string" || data.location.trim() === "") {
    return { ok: false, error: "場所を入力してください" }
  }
  const location = data.location.trim()
  if (location.length > MAX_LOCATION_LENGTH) {
    return {
      ok: false,
      error: `場所は${MAX_LOCATION_LENGTH}文字以内で入力してください`,
    }
  }

  // 集合時間
  if (typeof data.meetTime !== "string" || !MEET_TIME_PATTERN.test(data.meetTime)) {
    return { ok: false, error: "集合時間を正しく入力してください" }
  }
  const meetTime = data.meetTime

  // 定員（任意）
  let capacity: number | null = null
  if (data.capacity !== undefined && data.capacity !== null && data.capacity !== "") {
    const n =
      typeof data.capacity === "number" ? data.capacity : Number(data.capacity)
    if (!Number.isInteger(n) || n < 1 || n > MAX_CAPACITY) {
      return {
        ok: false,
        error: `定員は1〜${MAX_CAPACITY}の整数で入力してください`,
      }
    }
    capacity = n
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

  return { ok: true, value: { startsAt, location, meetTime, capacity, note } }
}
