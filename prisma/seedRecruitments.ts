// 募集系4機能（助っ人募集・メンバー募集・対戦相手募集・グラウンド譲渡）の
// サンプルデータ投入スクリプト。既存チーム（prisma/seed.ts で投入済み）に対して
// 各機能 約20件のダミーデータを追加する。
//
// 実行: npx ts-node prisma/seedRecruitments.ts
//
// 助っ人募集は「今後の試合」に紐づく必要があるため、対象チームに今後の試合がなければ
// 1件だけ新しい試合を作成してから紐づける。

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const SEED_USER_ID = "seed-admin-user"

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1))
}

// 今から1〜90日後のランダムな日時（10:00〜16:00の間、土日寄り）を返す
function futureDate(daysAhead = randomInt(1, 90)): Date {
  const date = new Date()
  date.setDate(date.getDate() + daysAhead)
  date.setHours(pick([9, 10, 13, 14, 15]), pick([0, 30]), 0, 0)
  return date
}

const POSITIONS_POOL = [
  "ピッチャー",
  "キャッチャー",
  "外野手",
  "内野手全般",
  "ファースト",
  "ショート",
  null,
]

const LEVEL_POOL = [
  "初心者歓迎",
  "経験者優先",
  "中級者以上",
  "未経験者OK",
  "ブランクOKです",
  null,
]

const HELPER_NOTES = [
  "経験者優先ですが初心者も歓迎です",
  "当日18時集合でお願いします",
  "用具レンタルあります",
  "雨天中止の場合はメールでご連絡します",
  null,
]

const MEMBER_NOTES = [
  "週末中心に活動しています",
  "見学・体験参加も大歓迎です",
  "年齢層は20代〜40代が中心です",
  "練習は月2回程度です",
  null,
]

const MATCH_NOTES = [
  "練習試合を希望しています",
  "雨天時は中止とさせていただきます",
  "終了後に懇親会も予定しています",
  "公式戦前の調整試合を希望します",
  null,
]

const GROUND_NOTES = [
  "雨天中止の場合は前日にご連絡します",
  "駐車場あり（10台程度）",
  "ナイター設備ありません",
  "更衣室・トイレあり",
  null,
]

const GROUND_NAMES = [
  "市営第一球場",
  "河川敷グラウンド A面",
  "総合運動公園野球場",
  "区民球技場 第2グラウンド",
  "市民球場",
]

const MATCH_LOCATIONS = [
  "都内の球場希望",
  "近郊であれば応相談",
  "当方ホームグラウンドで開催可",
  null,
]

async function main() {
  console.log("募集系ダミーデータの投入を開始します...")

  const teams = await prisma.team.findMany({
    select: { id: true, name: true, contactEmail: true },
    orderBy: { createdAt: "asc" },
  })
  if (teams.length === 0) {
    throw new Error("チームが存在しません。先に prisma/seed.ts を実行してください")
  }

  const contactEmailFor = (teamIndex: number, fallbackSlug: string) =>
    teams[teamIndex].contactEmail ?? `contact@${fallbackSlug}.example.com`

  const TARGET_COUNT = 20

  // ─── 助っ人募集（今後の試合に紐づける。なければ試合を1件作成する） ───

  let helperCreated = 0
  for (let i = 0; i < TARGET_COUNT; i++) {
    const team = teams[i % teams.length]

    let game = await prisma.game.findFirst({
      where: { teamId: team.id, startsAt: { gte: new Date() } },
      orderBy: { startsAt: "asc" },
    })
    if (!game) {
      const startsAt = futureDate()
      const startTime = `${String(startsAt.getHours()).padStart(2, "0")}:${String(startsAt.getMinutes()).padStart(2, "0")}`
      game = await prisma.game.create({
        data: {
          teamId: team.id,
          startsAt,
          location: pick(GROUND_NAMES),
          meetTime: startTime,
          startTime,
          createdById: SEED_USER_ID,
        },
      })
    }

    await prisma.helperRequest.create({
      data: {
        gameId: game.id,
        teamId: team.id,
        createdById: SEED_USER_ID,
        positions: pick(POSITIONS_POOL),
        count: randomInt(1, 4),
        note: pick(HELPER_NOTES),
        contactEmail: contactEmailFor(i % teams.length, `team${(i % teams.length) + 1}`),
        status: Math.random() < 0.2 ? "CLOSED" : "OPEN",
      },
    })
    helperCreated++
  }
  console.log(`助っ人募集を${helperCreated}件作成しました`)

  // ─── メンバー募集 ───

  let memberCreated = 0
  for (let i = 0; i < TARGET_COUNT; i++) {
    const team = teams[i % teams.length]
    await prisma.memberRequest.create({
      data: {
        teamId: team.id,
        createdById: SEED_USER_ID,
        positions: pick(POSITIONS_POOL),
        count: randomInt(1, 5),
        level: pick(LEVEL_POOL),
        note: pick(MEMBER_NOTES),
        contactEmail: contactEmailFor(i % teams.length, `team${(i % teams.length) + 1}`),
        status: Math.random() < 0.2 ? "CLOSED" : "OPEN",
      },
    })
    memberCreated++
  }
  console.log(`メンバー募集を${memberCreated}件作成しました`)

  // ─── 対戦相手募集 ───

  let matchCreated = 0
  for (let i = 0; i < TARGET_COUNT; i++) {
    const team = teams[i % teams.length]
    await prisma.matchRequest.create({
      data: {
        teamId: team.id,
        createdById: SEED_USER_ID,
        date: futureDate(),
        location: pick(MATCH_LOCATIONS),
        level: pick(LEVEL_POOL),
        memberCount: Math.random() < 0.7 ? randomInt(9, 15) : null,
        note: pick(MATCH_NOTES),
        contactEmail: contactEmailFor(i % teams.length, `team${(i % teams.length) + 1}`),
        status: Math.random() < 0.2 ? "CLOSED" : "OPEN",
      },
    })
    matchCreated++
  }
  console.log(`対戦相手募集を${matchCreated}件作成しました`)

  // ─── グラウンド譲渡 ───

  let groundCreated = 0
  for (let i = 0; i < TARGET_COUNT; i++) {
    const team = teams[i % teams.length]
    await prisma.groundOffer.create({
      data: {
        teamId: team.id,
        createdById: SEED_USER_ID,
        groundName: pick(GROUND_NAMES),
        location: `東京都${pick(["千代田区", "江戸川区", "町田市", "立川市", "八王子市", "府中市"])}${randomInt(1, 9)}-${randomInt(1, 9)}-${randomInt(1, 20)}`,
        date: futureDate(),
        capacity: Math.random() < 0.6 ? randomInt(20, 100) : null,
        note: pick(GROUND_NOTES),
        contactEmail: contactEmailFor(i % teams.length, `team${(i % teams.length) + 1}`),
        status: Math.random() < 0.2 ? "CLOSED" : "OPEN",
      },
    })
    groundCreated++
  }
  console.log(`グラウンド譲渡を${groundCreated}件作成しました`)

  console.log("募集系ダミーデータの投入が完了しました")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
