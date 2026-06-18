import { test } from "node:test"
import assert from "node:assert/strict"
import { validateMatchRequestInput } from "./matchRequests.ts"

const valid = {
  date: "2026-08-01T10:00",
  location: "東京都内の球場",
  level: "初心者歓迎",
  memberCount: 9,
  note: "練習試合希望",
  contactEmail: "contact@example.com",
}

test("validateMatchRequestInput: 妥当な入力を受け付け正規化する", () => {
  const r = validateMatchRequestInput(valid)
  assert.ok(r.ok)
  assert.equal(r.value.date.getTime(), new Date(valid.date).getTime())
  assert.equal(r.value.location, "東京都内の球場")
  assert.equal(r.value.level, "初心者歓迎")
  assert.equal(r.value.memberCount, 9)
  assert.equal(r.value.note, "練習試合希望")
  assert.equal(r.value.contactEmail, "contact@example.com")
})

test("validateMatchRequestInput: 試合希望日時が未指定/不正ならエラー", () => {
  for (const date of [undefined, null, "", "not-a-date"]) {
    const r = validateMatchRequestInput({ ...valid, date })
    assert.equal(r.ok, false, `date=${JSON.stringify(date)} は不正なはず`)
  }
})

test("validateMatchRequestInput: 希望場所・レベル感・参加予定人数・メモは任意（省略可）", () => {
  const r = validateMatchRequestInput({ date: valid.date, contactEmail: valid.contactEmail })
  assert.ok(r.ok)
  assert.equal(r.value.location, null)
  assert.equal(r.value.level, null)
  assert.equal(r.value.memberCount, null)
  assert.equal(r.value.note, null)
})

test("validateMatchRequestInput: 空文字の希望場所・レベル感・メモは null になる", () => {
  const r = validateMatchRequestInput({ ...valid, location: "", level: "", note: "" })
  assert.ok(r.ok)
  assert.equal(r.value.location, null)
  assert.equal(r.value.level, null)
  assert.equal(r.value.note, null)
})

test("validateMatchRequestInput: 参加予定人数が範囲外/非整数ならエラー", () => {
  for (const memberCount of [0, -1, 100, 1.5]) {
    const r = validateMatchRequestInput({ ...valid, memberCount })
    assert.equal(r.ok, false, `参加予定人数 ${memberCount} は不正なはず`)
  }
})

test("validateMatchRequestInput: レベル感が100文字超ならエラー", () => {
  const r = validateMatchRequestInput({ ...valid, level: "あ".repeat(101) })
  assert.equal(r.ok, false)
})

test("validateMatchRequestInput: メモが500文字超ならエラー", () => {
  const r = validateMatchRequestInput({ ...valid, note: "あ".repeat(501) })
  assert.equal(r.ok, false)
})

test("validateMatchRequestInput: オブジェクト以外はエラー", () => {
  assert.equal(validateMatchRequestInput(null).ok, false)
  assert.equal(validateMatchRequestInput("x").ok, false)
})

test("validateMatchRequestInput: 代表者メールアドレスが未指定ならエラー", () => {
  for (const contactEmail of [undefined, null, ""]) {
    const r = validateMatchRequestInput({ ...valid, contactEmail })
    assert.equal(r.ok, false, `contactEmail=${JSON.stringify(contactEmail)} は不正なはず`)
  }
})

test("validateMatchRequestInput: 代表者メールアドレスの形式が不正ならエラー", () => {
  for (const contactEmail of ["not-an-email", "foo@", "@example.com"]) {
    const r = validateMatchRequestInput({ ...valid, contactEmail })
    assert.equal(r.ok, false, `contactEmail=${contactEmail} は不正なはず`)
  }
})
