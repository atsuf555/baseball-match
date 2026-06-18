"use client"

import { PREFECTURES } from "@/lib/prefectures"

// 地域フィルター用のセレクトボックス。"all" は「全て（全国）」を表す
export function PrefectureSelect({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    >
      <option value="all">全て（全国）</option>
      {PREFECTURES.map((p) => (
        <option key={p} value={p}>
          {p}
        </option>
      ))}
    </select>
  )
}
