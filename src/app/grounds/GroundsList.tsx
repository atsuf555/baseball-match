"use client"

import { useState } from "react"
import Link from "next/link"
import { formatGameDateTime } from "@/lib/utils"
import { PrefectureSelect } from "@/components/PrefectureSelect"

export type GroundOfferListItem = {
  id: string
  teamName: string
  prefecture: string
  groundName: string
  location: string
  date: Date
  capacity: number | null
  note: string | null
  status: "OPEN" | "CLOSED"
}

// グラウンド譲渡の一覧表示。地域で絞り込める
export function GroundsList({ offers }: { offers: GroundOfferListItem[] }) {
  const [prefecture, setPrefecture] = useState("all")

  const filtered = offers.filter(
    (o) => prefecture === "all" || o.prefecture === prefecture
  )

  return (
    <>
      <div className="mb-3">
        <PrefectureSelect value={prefecture} onChange={setPrefecture} />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-xl p-8 text-center">
          <p className="text-sm text-zinc-400">現在譲渡情報はありません</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((o) => (
            <li key={o.id} className="bg-white border border-zinc-200 rounded-xl p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-zinc-400">{o.teamName}</p>
                  <h2 className="text-sm font-semibold text-zinc-900 mt-0.5">
                    {o.groundName}
                  </h2>
                  <p className="text-sm text-zinc-500 mt-0.5">
                    {o.location} ・ {formatGameDateTime(o.date)}
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5">📍 {o.prefecture}</p>
                </div>
                <span
                  className={`shrink-0 text-xs px-1.5 py-0.5 rounded font-medium ${
                    o.status === "OPEN"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-zinc-100 text-zinc-500"
                  }`}
                >
                  {o.status === "OPEN" ? "募集中" : "募集終了"}
                </span>
              </div>

              {o.capacity != null && (
                <p className="text-sm text-zinc-700 mt-3">収容人数 {o.capacity}人</p>
              )}

              {o.note && (
                <p className="text-xs text-zinc-500 mt-1 whitespace-pre-wrap">{o.note}</p>
              )}

              <Link
                href={`/grounds/${o.id}`}
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
