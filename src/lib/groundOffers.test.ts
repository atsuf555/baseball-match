import { test } from "node:test"
import assert from "node:assert/strict"
import { validateGroundOfferInput } from "./groundOffers.ts"

const valid = {
  groundName: "市営球場",
  location: "東京都千代田区1-1-1",
  date: "2026-08-01T10:00",
  capacity: 50,
  note: "雨天中止",
  contactEmail: "contact@example.com",
}

test("validateGroundOfferInput: 妥当な入力を受け付け正規化する", () => {
  const r = validateGroundOfferInput(valid)
  assert.ok(r.ok)
  assert.equal(r.value.groundName, "市営球場")
  assert.equal(r.value.location, "東京都千代田区1-1-1")
  assert.equal(r.value.date.getTime(), new Date(valid.date).getTime())
  assert.equal(r.value.capacity, 50)
  assert.equal(r.value.note, "雨天中止")
  assert.equal(r.value.contactEmail, "contact@example.com")
})

test("validateGroundOfferInput: グラウンド名が未指定ならエラー", () => {
  for (const groundName of [undefined, null, "", "   "]) {
    const r = validateGroundOfferInput({ ...valid, groundName })
    assert.equal(r.ok, false, `groundName=${JSON.stringify(groundName)} は不正なはず`)
  }
})

test("validateGroundOfferInput: 場所・住所が未指定ならエラー", () => {
  for (const location of [undefined, null, "", "   "]) {
    const r = validateGroundOfferInput({ ...valid, location })
    assert.equal(r.ok, false, `location=${JSON.stringify(location)} は不正なはず`)
  }
})

test("validateGroundOfferInput: 譲渡希望日時が未指定/不正ならエラー", () => {
  for (const date of [undefined, null, "", "not-a-date"]) {
    const r = validateGroundOfferInput({ ...valid, date })
    assert.equal(r.ok, false, `date=${JSON.stringify(date)} は不正なはず`)
  }
})

test("validateGroundOfferInput: 収容人数は任意（省略可）", () => {
  const r = validateGroundOfferInput({
    groundName: valid.groundName,
    location: valid.location,
    date: valid.date,
    contactEmail: valid.contactEmail,
  })
  assert.ok(r.ok)
  assert.equal(r.value.capacity, null)
  assert.equal(r.value.note, null)
})

test("validateGroundOfferInput: 収容人数が範囲外/非整数ならエラー", () => {
  for (const capacity of [0, -1, 1.5]) {
    const r = validateGroundOfferInput({ ...valid, capacity })
    assert.equal(r.ok, false, `収容人数 ${capacity} は不正なはず`)
  }
})

test("validateGroundOfferInput: メモが500文字超ならエラー", () => {
  const r = validateGroundOfferInput({ ...valid, note: "あ".repeat(501) })
  assert.equal(r.ok, false)
})

test("validateGroundOfferInput: オブジェクト以外はエラー", () => {
  assert.equal(validateGroundOfferInput(null).ok, false)
  assert.equal(validateGroundOfferInput("x").ok, false)
})

test("validateGroundOfferInput: 代表者メールアドレスが未指定ならエラー", () => {
  for (const contactEmail of [undefined, null, ""]) {
    const r = validateGroundOfferInput({ ...valid, contactEmail })
    assert.equal(r.ok, false, `contactEmail=${JSON.stringify(contactEmail)} は不正なはず`)
  }
})

test("validateGroundOfferInput: 代表者メールアドレスの形式が不正ならエラー", () => {
  for (const contactEmail of ["not-an-email", "foo@", "@example.com"]) {
    const r = validateGroundOfferInput({ ...valid, contactEmail })
    assert.equal(r.ok, false, `contactEmail=${contactEmail} は不正なはず`)
  }
})
