// チーム連絡先入力のバリデーション（副作用なしの純粋関数）

export type ValidatedTeamContact = {
  twitterUrl: string | null
  instagramUrl: string | null
  contactEmail: string | null
}

export type TeamContactValidationResult =
  | { ok: true; value: ValidatedTeamContact }
  | { ok: false; error: string }

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_URL_LENGTH = 200

export function validateTeamContactInput(body: unknown): TeamContactValidationResult {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "リクエストの形式が不正です" }
  }
  const data = body as Record<string, unknown>

  const twitterUrl = validateUrl(data.twitterUrl, ["twitter.com", "x.com"])
  if (twitterUrl === undefined) {
    return { ok: false, error: "X (Twitter) のURLが正しくありません" }
  }

  const instagramUrl = validateUrl(data.instagramUrl, ["instagram.com"])
  if (instagramUrl === undefined) {
    return { ok: false, error: "InstagramのURLが正しくありません" }
  }

  let contactEmail: string | null = null
  if (data.contactEmail !== undefined && data.contactEmail !== null) {
    if (typeof data.contactEmail !== "string") {
      return { ok: false, error: "メールアドレスの形式が不正です" }
    }
    const trimmed = data.contactEmail.trim()
    if (trimmed !== "") {
      if (!EMAIL_PATTERN.test(trimmed)) {
        return { ok: false, error: "メールアドレスの形式が正しくありません" }
      }
      contactEmail = trimmed
    }
  }

  return { ok: true, value: { twitterUrl, instagramUrl, contactEmail } }
}

// 値が未入力なら null、不正なら undefined（呼び出し側でエラーにする）、
// 有効な URL なら正規化済みの文字列を返す
function validateUrl(value: unknown, allowedHosts: string[]): string | null | undefined {
  if (value === undefined || value === null) return null
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  if (trimmed === "") return null
  if (trimmed.length > MAX_URL_LENGTH) return undefined

  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    return undefined
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return undefined
  const host = url.hostname.replace(/^www\./, "")
  if (!allowedHosts.includes(host)) return undefined

  return trimmed
}
