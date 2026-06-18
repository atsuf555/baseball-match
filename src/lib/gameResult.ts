// 試合結果入力のバリデーション（副作用なしの純粋関数）
// API ルートとユニットテストの双方から利用する

import type { GameResult } from "@prisma/client"

export type ValidatedGameResult = {
  opponentName: string
  ourScore: number
  opponentScore: number
  tournamentName: string | null
  summary: string | null
  result: GameResult
}

export type GameResultValidationResult =
  | { ok: true; value: ValidatedGameResult }
  | { ok: false; error: string }

const MAX_OPPONENT_NAME_LENGTH = 50
const MAX_TOURNAMENT_NAME_LENGTH = 50
const MAX_SUMMARY_LENGTH = 1000
const MAX_SCORE = 999

// スコアから WIN / LOSE / DRAW を自動計算する
export function computeResult(ourScore: number, opponentScore: number): GameResult {
  if (ourScore > opponentScore) return "WIN"
  if (ourScore < opponentScore) return "LOSE"
  return "DRAW"
}

export function validateGameResultInput(body: unknown): GameResultValidationResult {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "リクエストの形式が不正です" }
  }
  const data = body as Record<string, unknown>

  // 対戦相手名
  if (typeof data.opponentName !== "string" || data.opponentName.trim() === "") {
    return { ok: false, error: "対戦相手名を入力してください" }
  }
  const opponentName = data.opponentName.trim()
  if (opponentName.length > MAX_OPPONENT_NAME_LENGTH) {
    return {
      ok: false,
      error: `対戦相手名は${MAX_OPPONENT_NAME_LENGTH}文字以内で入力してください`,
    }
  }

  // 自チームスコア
  const ourScore = parseScore(data.ourScore)
  if (ourScore === null) {
    return { ok: false, error: "自チームスコアは0以上の整数で入力してください" }
  }

  // 相手スコア
  const opponentScore = parseScore(data.opponentScore)
  if (opponentScore === null) {
    return { ok: false, error: "相手スコアは0以上の整数で入力してください" }
  }

  // 大会名（任意）
  let tournamentName: string | null = null
  if (data.tournamentName !== undefined && data.tournamentName !== null) {
    if (typeof data.tournamentName !== "string") {
      return { ok: false, error: "大会名の形式が不正です" }
    }
    const trimmed = data.tournamentName.trim()
    if (trimmed.length > MAX_TOURNAMENT_NAME_LENGTH) {
      return {
        ok: false,
        error: `大会名は${MAX_TOURNAMENT_NAME_LENGTH}文字以内で入力してください`,
      }
    }
    tournamentName = trimmed === "" ? null : trimmed
  }

  // 戦評（任意）
  let summary: string | null = null
  if (data.summary !== undefined && data.summary !== null) {
    if (typeof data.summary !== "string") {
      return { ok: false, error: "戦評の形式が不正です" }
    }
    const trimmed = data.summary.trim()
    if (trimmed.length > MAX_SUMMARY_LENGTH) {
      return { ok: false, error: `戦評は${MAX_SUMMARY_LENGTH}文字以内で入力してください` }
    }
    summary = trimmed === "" ? null : trimmed
  }

  return {
    ok: true,
    value: {
      opponentName,
      ourScore,
      opponentScore,
      tournamentName,
      summary,
      result: computeResult(ourScore, opponentScore),
    },
  }
}

function parseScore(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null
  const n = typeof value === "number" ? value : Number(value)
  if (!Number.isInteger(n) || n < 0 || n > MAX_SCORE) return null
  return n
}
