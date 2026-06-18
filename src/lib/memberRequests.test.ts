import { test } from "node:test"
import assert from "node:assert/strict"
import { validateMemberRequestInput } from "./memberRequests.ts"

const valid = {
  positions: "ピッチャー、キャッチャー",
  count: 3,
  level: "初心者歓迎",
  note: "経験者優先",
  contactEmail: "contact@example.com",
}

test("validateMemberRequestInput: 妥当な入力を受け付け正規化する", () => {
  const r = validateMemberRequestInput(valid)
  assert.ok(r.ok)
  assert.equal(r.value.positions, "ピッチャー、キャッチャー")
  assert.equal(r.value.count, 3)
  assert.equal(r.value.level, "初心者歓迎")
  assert.equal(r.value.note, "経験者優先")
  assert.equal(r.value.contactEmail, "contact@example.com")
})

test("validateMemberRequestInput: ポジション・レベル感・メモは任意（省略可）", () => {
  const r = validateMemberRequestInput({ count: 2, contactEmail: "contact@example.com" })
  assert.ok(r.ok)
  assert.equal(r.value.positions, null)
  assert.equal(r.value.level, null)
  assert.equal(r.value.note, null)
})

test("validateMemberRequestInput: 空文字のポジション・レベル感・メモは null になる", () => {
  const r = validateMemberRequestInput({ ...valid, positions: "", level: "", note: "" })
  assert.ok(r.ok)
  assert.equal(r.value.positions, null)
  assert.equal(r.value.level, null)
  assert.equal(r.value.note, null)
})

test("validateMemberRequestInput: ポジションの前後空白は除去される", () => {
  const r = validateMemberRequestInput({ ...valid, positions: "  外野手  " })
  assert.ok(r.ok)
  assert.equal(r.value.positions, "外野手")
})

test("validateMemberRequestInput: 募集人数が未指定なら1人になる", () => {
  for (const count of [undefined, null, ""]) {
    const r = validateMemberRequestInput({ ...valid, count })
    assert.ok(r.ok, `count=${JSON.stringify(count)} は妥当なはず`)
    assert.equal(r.value.count, 1)
  }
})

test("validateMemberRequestInput: 募集人数が範囲外/非整数ならエラー", () => {
  for (const count of [0, -1, 100, 1.5]) {
    const r = validateMemberRequestInput({ ...valid, count })
    assert.equal(r.ok, false, `募集人数 ${count} は不正なはず`)
  }
})

test("validateMemberRequestInput: ポジションが100文字超ならエラー", () => {
  const r = validateMemberRequestInput({ ...valid, positions: "あ".repeat(101) })
  assert.equal(r.ok, false)
})

test("validateMemberRequestInput: レベル感が100文字超ならエラー", () => {
  const r = validateMemberRequestInput({ ...valid, level: "あ".repeat(101) })
  assert.equal(r.ok, false)
})

test("validateMemberRequestInput: メモが500文字超ならエラー", () => {
  const r = validateMemberRequestInput({ ...valid, note: "あ".repeat(501) })
  assert.equal(r.ok, false)
})

test("validateMemberRequestInput: オブジェクト以外はエラー", () => {
  assert.equal(validateMemberRequestInput(null).ok, false)
  assert.equal(validateMemberRequestInput("x").ok, false)
})

test("validateMemberRequestInput: 代表者メールアドレスを受け付け正規化する", () => {
  const r = validateMemberRequestInput({ ...valid, contactEmail: "  contact@example.com  " })
  assert.ok(r.ok)
  assert.equal(r.value.contactEmail, "contact@example.com")
})

test("validateMemberRequestInput: 代表者メールアドレスが未指定ならエラー", () => {
  for (const contactEmail of [undefined, null, ""]) {
    const r = validateMemberRequestInput({ ...valid, contactEmail })
    assert.equal(r.ok, false, `contactEmail=${JSON.stringify(contactEmail)} は不正なはず`)
  }
})

test("validateMemberRequestInput: 代表者メールアドレスの形式が不正ならエラー", () => {
  for (const contactEmail of ["not-an-email", "foo@", "@example.com"]) {
    const r = validateMemberRequestInput({ ...valid, contactEmail })
    assert.equal(r.ok, false, `contactEmail=${contactEmail} は不正なはず`)
  }
})
