// メンバー募集の作成入力バリデーション（副作用なしの純粋関数）
// API ルートとユニットテストの双方から利用する

import { isPrefecture } from "./prefectures.ts"

export type ValidatedMemberRequest = {
  positions: string | null
  count: number
  level: string | null
  note: string | null
  contactEmail: string
  prefecture: string
}

export type MemberRequestValidationResult =
  | { ok: true; value: ValidatedMemberRequest }
  | { ok: false; error: string }

const MAX_POSITIONS_LENGTH = 100
const MAX_LEVEL_LENGTH = 100
const MAX_NOTE_LENGTH = 500
const MAX_COUNT = 99
const MAX_CONTACT_EMAIL_LENGTH = 254
// 簡易的なメール形式チェック（厳密なRFC準拠ではなく、明らかな入力ミスを防ぐ目的）
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateMemberRequestInput(
  body: unknown
): MemberRequestValidationResult {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "リクエストの形式が不正です" }
  }
  const data = body as Record<string, unknown>

  // 募集人数（任意・未指定時は1人）
  let count = 1
  if (data.count !== undefined && data.count !== null && data.count !== "") {
    const parsed = typeof data.count === "number" ? data.count : Number(data.count)
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_COUNT) {
      return {
        ok: false,
        error: `募集人数は1〜${MAX_COUNT}の整数で入力してください`,
      }
    }
    count = parsed
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

  return { ok: true, value: { positions, count, level, note, contactEmail, prefecture } }
}
