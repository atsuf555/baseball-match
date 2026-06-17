import { test } from "node:test"
import assert from "node:assert/strict"
import { validateHelperRequestInput } from "./helperRequests.ts"

const valid = {
  positions: "ピッチャー、キャッチャー",
  capacity: 3,
  note: "経験者優先",
}

test("validateHelperRequestInput: 妥当な入力を受け付け正規化する", () => {
  const r = validateHelperRequestInput(valid)
  assert.ok(r.ok)
  assert.equal(r.value.positions, "ピッチャー、キャッチャー")
  assert.equal(r.value.capacity, 3)
  assert.equal(r.value.note, "経験者優先")
})

test("validateHelperRequestInput: ポジション・メモは任意（省略可）", () => {
  const r = validateHelperRequestInput({ capacity: 2 })
  assert.ok(r.ok)
  assert.equal(r.value.positions, null)
  assert.equal(r.value.note, null)
})

test("validateHelperRequestInput: 空文字のポジション・メモは null になる", () => {
  const r = validateHelperRequestInput({ ...valid, positions: "", note: "" })
  assert.ok(r.ok)
  assert.equal(r.value.positions, null)
  assert.equal(r.value.note, null)
})

test("validateHelperRequestInput: ポジションの前後空白は除去される", () => {
  const r = validateHelperRequestInput({ ...valid, positions: "  外野手  " })
  assert.ok(r.ok)
  assert.equal(r.value.positions, "外野手")
})

test("validateHelperRequestInput: 募集人数が未指定ならエラー", () => {
  for (const capacity of [undefined, null, ""]) {
    const r = validateHelperRequestInput({ ...valid, capacity })
    assert.equal(r.ok, false, `capacity=${JSON.stringify(capacity)} は不正なはず`)
  }
})

test("validateHelperRequestInput: 募集人数が範囲外/非整数ならエラー", () => {
  for (const capacity of [0, -1, 100, 1.5]) {
    const r = validateHelperRequestInput({ ...valid, capacity })
    assert.equal(r.ok, false, `募集人数 ${capacity} は不正なはず`)
  }
})

test("validateHelperRequestInput: ポジションが100文字超ならエラー", () => {
  const r = validateHelperRequestInput({ ...valid, positions: "あ".repeat(101) })
  assert.equal(r.ok, false)
})

test("validateHelperRequestInput: メモが500文字超ならエラー", () => {
  const r = validateHelperRequestInput({ ...valid, note: "あ".repeat(501) })
  assert.equal(r.ok, false)
})

test("validateHelperRequestInput: オブジェクト以外はエラー", () => {
  assert.equal(validateHelperRequestInput(null).ok, false)
  assert.equal(validateHelperRequestInput("x").ok, false)
})
