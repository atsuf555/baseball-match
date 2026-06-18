// 対戦相手募集の作成入力バリデーション（副作用なしの純粋関数）
// API ルートとユニットテストの双方から利用する

import { isPrefecture } from "./prefectures.ts"

export type ValidatedMatchRequest = {
  date: Date
  location: string | null
  level: string | null
  memberCount: number | null
  note: string | null
  contactEmail: string
  prefecture: string
}

export type MatchRequestValidationResult =
  | { ok: true; value: ValidatedMatchRequest }
  | { ok: false; error: string }

const MAX_LOCATION_LENGTH = 200
const MAX_LEVEL_LENGTH = 100
const MAX_NOTE_LENGTH = 500
const MAX_MEMBER_COUNT = 99
const MAX_CONTACT_EMAIL_LENGTH = 254
// 簡易的なメール形式チェック（厳密なRFC準拠ではなく、明らかな入力ミスを防ぐ目的）
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateMatchRequestInput(
  body: unknown
): MatchRequestValidationResult {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "リクエストの形式が不正です" }
  }
  const data = body as Record<string, unknown>

  // 試合希望日時（必須）
  if (typeof data.date !== "string" || data.date.trim() === "") {
    return { ok: false, error: "試合希望日時を入力してください" }
  }
  const date = new Date(data.date)
  if (Number.isNaN(date.getTime())) {
    return { ok: false, error: "試合希望日時の形式が不正です" }
  }

  // 希望場所（任意）
  let location: string | null = null
  if (data.location !== undefined && data.location !== null) {
    if (typeof data.location !== "string") {
      return { ok: false, error: "希望場所の形式が不正です" }
    }
    const trimmed = data.location.trim()
    if (trimmed.length > MAX_LOCATION_LENGTH) {
      return {
        ok: false,
        error: `希望場所は${MAX_LOCATION_LENGTH}文字以内で入力してください`,
      }
    }
    location = trimmed === "" ? null : trimmed
  }

  // レベル感（任意）
  let level: string | null = null
  if (data.level !== undefined && data.level !== null) {
    if (typeof data.level !== "string") {
      return { ok: false, error: "レベル感の形式が不正です" }
    }
    const trimmed = data.level.trim()
    if (trimmed.length > MAX_LEVEL_LENGTH) {
      return {
        ok: false,
        error: `レベル感は${MAX_LEVEL_LENGTH}文字以内で入力してください`,
      }
    }
    level = trimmed === "" ? null : trimmed
  }

  // 参加予定人数（任意）
  let memberCount: number | null = null
  if (
    data.memberCount !== undefined &&
    data.memberCount !== null &&
    data.memberCount !== ""
  ) {
    const parsed =
      typeof data.memberCount === "number" ? data.memberCount : Number(data.memberCount)
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_MEMBER_COUNT) {
      return {
        ok: false,
        error: `参加予定人数は1〜${MAX_MEMBER_COUNT}の整数で入力してください`,
      }
    }
    memberCount = parsed
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
    value: { date, location, level, memberCount, note, contactEmail, prefecture },
  }
}
