// 募集掲示板（ホーム画面）のカテゴリ定義
// 将来カテゴリを追加する場合は、この配列に1行追加するだけでフィルターボタンが増える
export const RECRUITMENT_CATEGORIES = [
  { key: "all", label: "全て" },
  { key: "helper", label: "助っ人募集" },
  { key: "opponent", label: "対戦相手募集" },
  { key: "ground", label: "グラウンド譲渡" },
  { key: "member", label: "メンバー募集" },
] as const

export type RecruitmentCategoryKey = (typeof RECRUITMENT_CATEGORIES)[number]["key"]
