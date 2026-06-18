// サンプルデータ投入スクリプト
// 実行: npm run db:seed
//
// 20チーム × 5年分（2020〜2024年）× 20試合 = 2000試合 を投入する。
// Team/Game の createdById は外部キー制約のない単純な文字列フィールドなので、
// 実際の User レコードを作らずダミーIDで埋める。

import { PrismaClient, type GameResult } from "@prisma/client"

const prisma = new PrismaClient()

const SEED_USER_ID = "seed-admin-user"

// ─── チーム名・対戦相手名（実在しない草野球チーム） ────────────────

const TEAM_NAMES = [
  "葛西リバーズ",
  "多摩川ファルコンズ",
  "緑が丘ベアーズ",
  "港北イーグルス",
  "桜台コメッツ",
  "平和台サンダース",
  "旭が丘ホークス",
  "青葉台ライオンズ",
  "杉並ウォリアーズ",
  "江戸川ドルフィンズ",
  "西新井ファイターズ",
  "北千住ブレイブス",
  "練馬フェニックス",
  "世田谷ジャガーズ",
  "板橋スターズ",
  "立川バイソンズ",
  "八王子レッズ",
  "町田パイレーツ",
  "府中タイタンズ",
  "国分寺ロケッツ",
]

// チーム外の対戦相手プール（リーグ内対戦に加え、こちらとも対戦する）
const OPPONENT_ONLY_NAMES = [
  "浦和コンドルズ",
  "川崎マリナーズ",
  "横浜ベイホークス",
  "千葉メテオーズ",
  "柏ユニコーンズ",
  "大宮ジェッツ",
  "所沢クラウンズ",
  "川越ナイツ",
  "越谷ペガサス",
  "春日部ストーンズ",
]

const TOURNAMENT_NAMES = [
  null,
  null,
  null,
  null,
  null, // 練習試合（大会名なし）が高確率
  "市民リーグ春季大会",
  "市民リーグ秋季大会",
  "区民大会",
  "新人戦",
  "親睦リーグ",
  "草野球選手権 東日本予選",
  "週末リーグ",
]

const LOCATIONS = [
  "荒川河川敷グラウンド A面",
  "多摩川緑地球場",
  "市営総合運動公園野球場",
  "区民球技場 第2グラウンド",
  "総合グラウンド B面",
  "河川敷運動広場",
  "市民球場",
  "総合公園野球場",
]

const PLAYER_SURNAMES = [
  "佐藤",
  "鈴木",
  "高橋",
  "田中",
  "渡辺",
  "伊藤",
  "山本",
  "中村",
  "小林",
  "加藤",
  "吉田",
  "山田",
  "佐々木",
  "斎藤",
  "松本",
]

const WIN_HIGHLIGHTS = [
  "終盤の集中打で試合をひっくり返した。",
  "先発投手が要所を締め、最少失点でゲームを作った。",
  "序盤に大量得点を奪い、終始試合をリードした。",
  "守備の好プレーが続き、相手の反撃を許さなかった。",
  "接戦を制し、土壇場での勝負強さを見せた。",
]

const LOSE_HIGHLIGHTS = [
  "終盤の継投がうまくいかず、逆転を許した。",
  "守備のミスが重なり、後手を踏んだ。",
  "好機を活かせず、得点機会を逃した。",
  "相手の好投に苦しみ、最後まで反撃できなかった。",
  "接戦だったが、最終回に力尽きた。",
]

const DRAW_HIGHLIGHTS = [
  "終盤まで一歩も譲らない投手戦となった。",
  "両チームとも好機を生かせず、引き分けに終わった。",
  "シーソーゲームの末、決着がつかなかった。",
]

const PLAYER_PLAYS = [
  "{name}選手の長打が試合を動かした。",
  "{name}選手が好守備でピンチを救った。",
  "{name}選手が要所で安打を放ち、得点に絡んだ。",
  "{name}選手の盗塁が試合のリズムを変えた。",
]

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1))
}

function computeResult(ourScore: number, opponentScore: number): GameResult {
  if (ourScore > opponentScore) return "WIN"
  if (ourScore < opponentScore) return "LOSE"
  return "DRAW"
}

function buildSummary(result: GameResult): string {
  const highlight =
    result === "WIN" ? pick(WIN_HIGHLIGHTS) : result === "LOSE" ? pick(LOSE_HIGHLIGHTS) : pick(DRAW_HIGHLIGHTS)
  const play = pick(PLAYER_PLAYS).replace("{name}", pick(PLAYER_SURNAMES))
  return `${highlight}${play}`
}

const INVITE_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
function generateInviteCode(used: Set<string>): string {
  let code: string
  do {
    code = Array.from(
      { length: 6 },
      () => INVITE_CODE_ALPHABET[Math.floor(Math.random() * INVITE_CODE_ALPHABET.length)]
    ).join("")
  } while (used.has(code))
  used.add(code)
  return code
}

const TIME_SLOTS = ["09:00", "10:00", "13:00", "14:00"]

function meetTimeFor(startTime: string): string {
  const [h, m] = startTime.split(":").map(Number)
  const totalMinutes = h * 60 + m - 30
  const mm = String(totalMinutes % 60).padStart(2, "0")
  const hh = String(Math.floor(totalMinutes / 60)).padStart(2, "0")
  return `${hh}:${mm}`
}

// 1年間（3月〜11月、計36週）の中からランダムに20週を選び、その週の土曜10:00startsAtを作る
function generateGameDatesForYear(year: number): Date[] {
  const weeks = Array.from({ length: 36 }, (_, i) => i)
  // シャッフルして先頭20週を採用 → 試合日時順に並べ替える
  for (let i = weeks.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[weeks[i], weeks[j]] = [weeks[j], weeks[i]]
  }
  const chosenWeeks = weeks.slice(0, 20).sort((a, b) => a - b)

  // 3月第1土曜を起点とする
  const seasonStart = new Date(Date.UTC(year, 2, 1))
  while (seasonStart.getUTCDay() !== 6) {
    seasonStart.setUTCDate(seasonStart.getUTCDate() + 1)
  }

  return chosenWeeks.map((w) => {
    const date = new Date(seasonStart)
    date.setUTCDate(date.getUTCDate() + w * 7)
    return date
  })
}

async function main() {
  console.log("シードデータの投入を開始します...")

  const usedInviteCodes = new Set<string>()
  const allOpponentNames = [...TEAM_NAMES, ...OPPONENT_ONLY_NAMES]

  const teamIds: { id: string; name: string }[] = []

  for (const [index, name] of TEAM_NAMES.entries()) {
    const slug = `team${index + 1}`
    const team = await prisma.team.create({
      data: {
        name,
        description: `${name}は地域で活動する草野球チームです。初心者から経験者まで歓迎しています。`,
        inviteCode: generateInviteCode(usedInviteCodes),
        createdById: SEED_USER_ID,
        twitterUrl: `https://x.com/${slug}_baseball`,
        instagramUrl: `https://instagram.com/${slug}_baseball`,
        contactEmail: `contact@${slug}.example.com`,
      },
      select: { id: true, name: true },
    })
    teamIds.push(team)
  }

  console.log(`チームを${teamIds.length}件作成しました`)

  type GameRow = {
    teamId: string
    startsAt: Date
    location: string
    meetTime: string
    startTime: string
    capacity: number | null
    createdById: string
    opponentName: string
    ourScore: number
    opponentScore: number
    tournamentName: string | null
    summary: string
    result: GameResult
  }

  const games: GameRow[] = []

  for (const team of teamIds) {
    for (let year = 2020; year <= 2024; year++) {
      const dates = generateGameDatesForYear(year)
      for (const date of dates) {
        const startTime = pick(TIME_SLOTS)
        const [h, m] = startTime.split(":").map(Number)
        const startsAt = new Date(date)
        startsAt.setUTCHours(h, m, 0, 0)

        const opponentName = pick(allOpponentNames.filter((n) => n !== team.name))
        const ourScore = randomInt(0, 12)
        // 引き分けは稀（約8%）にする
        const opponentScore = Math.random() < 0.08 ? ourScore : randomInt(0, 12)
        const result = computeResult(ourScore, opponentScore)

        games.push({
          teamId: team.id,
          startsAt,
          location: pick(LOCATIONS),
          meetTime: meetTimeFor(startTime),
          startTime,
          capacity: Math.random() < 0.5 ? randomInt(14, 20) : null,
          createdById: SEED_USER_ID,
          opponentName,
          ourScore,
          opponentScore,
          tournamentName: pick(TOURNAMENT_NAMES),
          summary: buildSummary(result),
          result,
        })
      }
    }
  }

  console.log(`試合データを${games.length}件作成します...`)

  // createMany は1回あたりの件数上限を避けるため500件ずつに分割する
  const CHUNK_SIZE = 500
  for (let i = 0; i < games.length; i += CHUNK_SIZE) {
    const chunk = games.slice(i, i + CHUNK_SIZE)
    await prisma.game.createMany({ data: chunk })
    console.log(`  ${Math.min(i + CHUNK_SIZE, games.length)}/${games.length} 件投入済み`)
  }

  console.log("シードデータの投入が完了しました")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
