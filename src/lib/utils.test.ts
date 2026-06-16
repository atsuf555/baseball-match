import { test } from "node:test"
import assert from "node:assert/strict"
import { generateInviteCode, normalizeInviteCode } from "./utils.ts"

// 招待コードに使われる文字集合（誤読しやすい O/0/I/1 を除外した英数字大文字）
const ALLOWED = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/

test("generateInviteCode: 常に6文字を返す", () => {
  for (let i = 0; i < 1000; i++) {
    assert.equal(generateInviteCode().length, 6)
  }
})

test("generateInviteCode: 許可された文字だけで構成される", () => {
  for (let i = 0; i < 1000; i++) {
    assert.match(generateInviteCode(), ALLOWED)
  }
})

test("generateInviteCode: 誤読しやすい文字(O/0/I/1)を含まない", () => {
  for (let i = 0; i < 1000; i++) {
    const code = generateInviteCode()
    assert.ok(!/[OI01]/.test(code), `紛らわしい文字を含む: ${code}`)
  }
})

test("generateInviteCode: ある程度ランダムである（同一値が連発しない）", () => {
  const codes = new Set<string>()
  for (let i = 0; i < 200; i++) codes.add(generateInviteCode())
  // 200回生成して大半がユニークであることを確認（衝突がほぼ無い）
  assert.ok(codes.size > 190, `ユニーク数が少なすぎる: ${codes.size}/200`)
})

test("normalizeInviteCode: 前後の空白を除去して大文字化する", () => {
  assert.equal(normalizeInviteCode("  a3k9zr  "), "A3K9ZR")
})

test("normalizeInviteCode: 小文字を大文字に変換する", () => {
  assert.equal(normalizeInviteCode("abc234"), "ABC234")
})

test("normalizeInviteCode: 既に正規化済みの値はそのまま返す", () => {
  assert.equal(normalizeInviteCode("A3K9ZR"), "A3K9ZR")
})

test("normalizeInviteCode: 生成したコードは正規化しても変わらない（冪等）", () => {
  for (let i = 0; i < 100; i++) {
    const code = generateInviteCode()
    assert.equal(normalizeInviteCode(code), code)
  }
})
