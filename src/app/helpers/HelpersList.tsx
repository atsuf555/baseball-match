"use client"

import { useState } from "react"
import Link from "next/link"
import { formatGameDateTime } from "@/lib/utils"
import { PrefectureSelect } from "@/components/PrefectureSelect"

export type HelperRequestListItem = {
  id: string
  teamName: string
  prefecture: string
  startsAt: Date
  location: string
  startTime: string
  positions: string | null
  count: number
  note: string | null
  status: "OPEN" | "CLOSED"
}

// 助っ人募集の一覧表示。地域で絞り込める
export function HelpersList({ requests }: { requests: HelperRequestListItem[] }) {
  const [prefecture, setPrefecture] = useState("all")

  const filtered = requests.filter(
    (r) => prefecture === "all" || r.prefecture === prefecture
  )

  return (
    <>
      <div className="mb-3">
        <PrefectureSelect value={prefecture} onChange={setPrefecture} />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-xl p-8 text-center">
          <p className="text-sm text-zinc-400">現在募集中の助っ人はありません</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((r) => (
            <li key={r.id} className="bg-white border border-zinc-200 rounded-xl p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-zinc-400">{r.teamName}</p>
                  <h2 className="text-sm font-semibold text-zinc-900 mt-0.5">
                    {formatGameDateTime(r.startsAt)}
                  </h2>
                  <p className="text-sm text-zinc-500 mt-0.5">
                    {r.location} ・ 開始 {r.startTime}
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5">📍 {r.prefecture}</p>
                </div>
                <span
                  className={`shrink-0 text-xs px-1.5 py-0.5 rounded font-medium ${
                    r.status === "OPEN"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-zinc-100 text-zinc-500"
                  }`}
                >
                  {r.status === "OPEN" ? "募集中" : "募集終了"}
                </span>
              </div>

              <p className="text-sm text-zinc-700 mt-3">
                {r.positions ?? "ポジション指定なし"}
                <span className="text-zinc-400 ml-1.5">（募集 {r.count}人）</span>
              </p>

              {r.note && (
                <p className="text-xs text-zinc-500 mt-1 whitespace-pre-wrap">{r.note}</p>
              )}

              <Link
                href={`/helpers/${r.id}`}
                className="inline-block text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors mt-3"
              >
                詳細を見る
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
