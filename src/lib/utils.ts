// 招待コード用の文字集合
// 見間違えやすい文字（O/0, I/1）を除いた英数字大文字で構成する
const INVITE_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
const INVITE_CODE_LENGTH = 6

// 6文字の招待コードを生成する
// 文字数が常に固定なので、Math.random().toString(36) のように
// 末尾が短くなって桁落ちする心配がない
export function generateInviteCode(): string {
  let code = ""
  for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
    const index = Math.floor(Math.random() * INVITE_CODE_ALPHABET.length)
    code += INVITE_CODE_ALPHABET[index]
  }
  return code
}

// ユーザー入力の招待コードを正規化する（前後の空白除去・大文字化）
export function normalizeInviteCode(input: string): string {
  return input.trim().toUpperCase()
}
