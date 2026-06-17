// 試合作成の入力バリデーション（副作用なしの純粋関数）
// API ルートとユニットテストの双方から利用する

export type ValidatedGame = {
  startsAt: Date
  location: string
  meetTime: string
  startTime: string
  capacity: number | null
  note: string | null
}

export type GameValidationResult =
  | { ok: true; value: ValidatedGame }
  | { ok: false; error: string }

// "HH:mm" かつ分は 00 または 30 のみ（30分単位）。集合時間・試合開始時間で共用
const TIME_PATTERN = /^([01]\d|2[0-3]):(00|30)$/
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
  // 30分単位のみ許可（日本は UTC+9 で分は変わらないため UTC の分で判定可能）
  if (startsAt.getUTCMinutes() % 30 !== 0 || startsAt.getUTCSeconds() !== 0) {
    return { ok: false, error: "試合日時は30分単位で入力してください" }
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
  if (typeof data.meetTime !== "string" || !TIME_PATTERN.test(data.meetTime)) {
    return {
      ok: false,
      error: "集合時間は30分単位（00分・30分）で入力してください",
    }
  }
  const meetTime = data.meetTime

  // 試合開始時間
  if (typeof data.startTime !== "string" || !TIME_PATTERN.test(data.startTime)) {
    return {
      ok: false,
      error: "試合開始時間は30分単位（00分・30分）で入力してください",
    }
  }
  const startTime = data.startTime

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

  return {
    ok: true,
    value: { startsAt, location, meetTime, startTime, capacity, note },
  }
}
