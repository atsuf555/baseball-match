import { test } from "node:test"
import assert from "node:assert/strict"
import { validateGameInput } from "./games.ts"

const valid = {
  startsAt: "2026-06-20T01:00:00.000Z",
  location: "区民グラウンド",
  meetTime: "09:30",
  capacity: 15,
  note: "スパイク不可",
}

test("validateGameInput: 妥当な入力を受け付け正規化する", () => {
  const r = validateGameInput(valid)
  assert.ok(r.ok)
  assert.ok(r.value.startsAt instanceof Date)
  assert.equal(r.value.location, "区民グラウンド")
  assert.equal(r.value.meetTime, "09:30")
  assert.equal(r.value.capacity, 15)
  assert.equal(r.value.note, "スパイク不可")
})

test("validateGameInput: 定員・メモは任意（省略可）", () => {
  const r = validateGameInput({
    startsAt: valid.startsAt,
    location: "A面",
    meetTime: "10:00",
  })
  assert.ok(r.ok)
  assert.equal(r.value.capacity, null)
  assert.equal(r.value.note, null)
})

test("validateGameInput: 空文字の定員・メモは null になる", () => {
  const r = validateGameInput({ ...valid, capacity: "", note: "" })
  assert.ok(r.ok)
  assert.equal(r.value.capacity, null)
  assert.equal(r.value.note, null)
})

test("validateGameInput: 場所の前後空白は除去される", () => {
  const r = validateGameInput({ ...valid, location: "  公園  " })
  assert.ok(r.ok)
  assert.equal(r.value.location, "公園")
})

test("validateGameInput: 試合日時が空ならエラー", () => {
  const r = validateGameInput({ ...valid, startsAt: "" })
  assert.equal(r.ok, false)
})

test("validateGameInput: 試合日時が不正な文字列ならエラー", () => {
  const r = validateGameInput({ ...valid, startsAt: "not-a-date" })
  assert.equal(r.ok, false)
})

test("validateGameInput: 場所が空ならエラー", () => {
  const r = validateGameInput({ ...valid, location: "   " })
  assert.equal(r.ok, false)
})

test("validateGameInput: 集合時間の形式が不正ならエラー", () => {
  for (const meetTime of ["9:30", "25:00", "10:60", "1030", "", "abc"]) {
    const r = validateGameInput({ ...valid, meetTime })
    assert.equal(r.ok, false, `"${meetTime}" は不正なはず`)
  }
})

test("validateGameInput: 定員が範囲外/非整数ならエラー", () => {
  for (const capacity of [0, -3, 1000, 1.5]) {
    const r = validateGameInput({ ...valid, capacity })
    assert.equal(r.ok, false, `定員 ${capacity} は不正なはず`)
  }
})

test("validateGameInput: メモが500文字超ならエラー", () => {
  const r = validateGameInput({ ...valid, note: "あ".repeat(501) })
  assert.equal(r.ok, false)
})

test("validateGameInput: オブジェクト以外はエラー", () => {
  assert.equal(validateGameInput(null).ok, false)
  assert.equal(validateGameInput("x").ok, false)
})
