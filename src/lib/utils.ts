// 6文字の英数字大文字を生成する（招待コード用）
// 衝突確率: 1 / 36^6 ≒ 1 / 21億 で実用上問題なし
export function generateInviteCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}
