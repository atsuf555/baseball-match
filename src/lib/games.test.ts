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

test("validateGameInput: 集合時間が30分単位でなければエラー", () => {
  for (const meetTime of ["09:15", "09:45", "10:01", "10:29"]) {
    const r = validateGameInput({ ...valid, meetTime })
    assert.equal(r.ok, false, `"${meetTime}" は30分単位でないので不正なはず`)
  }
})

test("validateGameInput: 集合時間が00分/30分なら受け付ける", () => {
  for (const meetTime of ["00:00", "09:00", "09:30", "23:30"]) {
    const r = validateGameInput({ ...valid, meetTime })
    assert.ok(r.ok, `"${meetTime}" は受け付けるはず`)
  }
})

test("validateGameInput: 試合日時が30分単位でなければエラー", () => {
  // 2026-06-20 10:15 JST = 01:15 UTC（分は15なので不正）
  const r = validateGameInput({ ...valid, startsAt: "2026-06-20T01:15:00.000Z" })
  assert.equal(r.ok, false)
})

test("validateGameInput: 試合日時が30分単位なら受け付ける", () => {
  // 01:30 UTC（分は30なので妥当）
  const r = validateGameInput({ ...valid, startsAt: "2026-06-20T01:30:00.000Z" })
  assert.ok(r.ok)
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
