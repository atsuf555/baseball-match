// グラウンド譲渡の作成入力バリデーション（副作用なしの純粋関数）
// API ルートとユニットテストの双方から利用する

import { isPrefecture } from "./prefectures.ts"

export type ValidatedGroundOffer = {
  groundName: string
  location: string
  date: Date
  capacity: number | null
  note: string | null
  contactEmail: string
  prefecture: string
}

export type GroundOfferValidationResult =
  | { ok: true; value: ValidatedGroundOffer }
  | { ok: false; error: string }

const MAX_GROUND_NAME_LENGTH = 100
const MAX_LOCATION_LENGTH = 200
const MAX_NOTE_LENGTH = 500
const MAX_CAPACITY = 9999
const MAX_CONTACT_EMAIL_LENGTH = 254
// 簡易的なメール形式チェック（厳密なRFC準拠ではなく、明らかな入力ミスを防ぐ目的）
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateGroundOfferInput(
  body: unknown
): GroundOfferValidationResult {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "リクエストの形式が不正です" }
  }
  const data = body as Record<string, unknown>

  // グラウンド名（必須）
  if (typeof data.groundName !== "string") {
    return { ok: false, error: "グラウンド名を入力してください" }
  }
  const groundName = data.groundName.trim()
  if (groundName === "") {
    return { ok: false, error: "グラウンド名を入力してください" }
  }
  if (groundName.length > MAX_GROUND_NAME_LENGTH) {
    return {
      ok: false,
      error: `グラウンド名は${MAX_GROUND_NAME_LENGTH}文字以内で入力してください`,
    }
  }

  // 場所・住所（必須）
  if (typeof data.location !== "string") {
    return { ok: false, error: "場所・住所を入力してください" }
  }
  const location = data.location.trim()
  if (location === "") {
    return { ok: false, error: "場所・住所を入力してください" }
  }
  if (location.length > MAX_LOCATION_LENGTH) {
    return {
      ok: false,
      error: `場所・住所は${MAX_LOCATION_LENGTH}文字以内で入力してください`,
    }
  }

  // 譲渡希望日時（必須）
  if (typeof data.date !== "string" || data.date.trim() === "") {
    return { ok: false, error: "譲渡希望日時を入力してください" }
  }
  const date = new Date(data.date)
  if (Number.isNaN(date.getTime())) {
    return { ok: false, error: "譲渡希望日時の形式が不正です" }
  }

  // 収容人数（任意）
  let capacity: number | null = null
  if (data.capacity !== undefined && data.capacity !== null && data.capacity !== "") {
    const parsed =
      typeof data.capacity === "number" ? data.capacity : Number(data.capacity)
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_CAPACITY) {
      return {
        ok: false,
        error: `収容人数は1〜${MAX_CAPACITY}の整数で入力してください`,
      }
    }
    capacity = parsed
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

  // 代表者メールアドレス（必須）
  if (
    data.contactEmail === undefined ||
    data.contactEmail === null ||
    typeof data.contactEmail !== "string"
  ) {
    return { ok: false, error: "代表者メールアドレスを入力してください" }
  }
  const contactEmail = data.contactEmail.trim()
  if (contactEmail === "") {
    return { ok: false, error: "代表者メールアドレスを入力してください" }
  }
  if (contactEmail.length > MAX_CONTACT_EMAIL_LENGTH || !EMAIL_PATTERN.test(contactEmail)) {
    return { ok: false, error: "メールアドレスの形式が正しくありません" }
  }

  // 都道府県（必須）
  if (!isPrefecture(data.prefecture)) {
    return { ok: false, error: "都道府県を選択してください" }
  }
  const prefecture = data.prefecture

  return {
    ok: true,
    value: { groundName, location, date, capacity, note, contactEmail, prefecture },
  }
}
