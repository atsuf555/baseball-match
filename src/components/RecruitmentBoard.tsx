"use client"

import { useState } from "react"
import Link from "next/link"
import { formatGameDateTime } from "@/lib/utils"
import {
  RECRUITMENT_CATEGORIES,
  type RecruitmentCategoryKey,
} from "@/lib/recruitmentCategories"
import { PrefectureSelect } from "@/components/PrefectureSelect"

// 助っ人募集カードのデータ（試合に紐づく）
type HelperCard = {
  id: string
  category: "helper"
  teamName: string
  prefecture: string
  startsAt: Date
  location: string
  positions: string | null
  count: number
  note: string | null
  status: "OPEN" | "CLOSED"
}

// メンバー募集カードのデータ（チームに紐づく・試合日時や場所はない）
type MemberCard = {
  id: string
  category: "member"
  teamName: string
  prefecture: string
  positions: string | null
  count: number
  level: string | null
  note: string | null
  status: "OPEN" | "CLOSED"
}

// 対戦相手募集カードのデータ
type MatchCard = {
  id: string
  category: "match"
  teamName: string
  prefecture: string
  date: Date
  location: string | null
  level: string | null
  memberCount: number | null
  note: string | null
  status: "OPEN" | "CLOSED"
}

// グラウンド譲渡カードのデータ
type GroundCard = {
  id: string
  category: "ground"
  teamName: string
  prefecture: string
  groundName: string
  location: string
  date: Date
  capacity: number | null
  note: string | null
  status: "OPEN" | "CLOSED"
}

// 募集カードのデータ。将来カテゴリを追加する際はこのユニオン型に追加していく
export type RecruitmentCard = HelperCard | MemberCard | MatchCard | GroundCard

const CATEGORY_BADGE: Record<RecruitmentCard["category"], string> = {
  helper: "助っ人募集",
  member: "メンバー募集",
  match: "対戦相手募集",
  ground: "グラウンド譲渡",
}

// 募集カードの詳細ページへのリンク先。カテゴリごとに異なるパスを持つ
const DETAIL_PATH: Record<RecruitmentCard["category"], (id: string) => string> = {
  helper: (id) => `/helpers/${id}`,
  member: (id) => `/members/${id}`,
  match: (id) => `/matches/${id}`,
  ground: (id) => `/grounds/${id}`,
}

// カードの主要情報部分。カテゴリごとに表示するフィールドが異なる
function CardBody({ card }: { card: RecruitmentCard }) {
  switch (card.category) {
    case "helper":
      return (
        <>
          <h3 className="text-sm font-semibold text-zinc-900 mt-0.5">
            {formatGameDateTime(card.startsAt)}
          </h3>
          <p className="text-sm text-zinc-500 mt-0.5">{card.location}</p>
        </>
      )
    case "member":
      return (
        card.level && (
          <h3 className="text-sm font-semibold text-zinc-900 mt-0.5">{card.level}</h3>
        )
      )
    case "match":
      return (
        <>
          <h3 className="text-sm font-semibold text-zinc-900 mt-0.5">
            {formatGameDateTime(card.date)}
          </h3>
          <p className="text-sm text-zinc-500 mt-0.5">{card.location ?? "場所未定"}</p>
        </>
      )
    case "ground":
      return (
        <>
          <h3 className="text-sm font-semibold text-zinc-900 mt-0.5">{card.groundName}</h3>
          <p className="text-sm text-zinc-500 mt-0.5">
            {card.location} ・ {formatGameDateTime(card.date)}
          </p>
        </>
      )
  }
}

// カードの補足情報行（募集人数・レベル感・収容人数など、カテゴリごとに異なる）
function CardInfoLine({ card }: { card: RecruitmentCard }) {
  switch (card.category) {
    case "helper":
      return (
        <p className="text-sm text-zinc-700 mt-3">
          {card.positions ?? "ポジション指定なし"}
          <span className="text-zinc-400 ml-1.5">（募集 {card.count}人）</span>
        </p>
      )
    case "member":
      return (
        <p className="text-sm text-zinc-700 mt-3">
          {card.positions ?? "ポジション指定なし"}
          <span className="text-zinc-400 ml-1.5">（募集 {card.count}人）</span>
        </p>
      )
    case "match":
      return (
        <p className="text-sm text-zinc-700 mt-3">
          {card.level ?? "レベル指定なし"}
          {card.memberCount != null && (
            <span className="text-zinc-400 ml-1.5">（参加予定 {card.memberCount}人）</span>
          )}
        </p>
      )
    case "ground":
      return card.capacity != null ? (
        <p className="text-sm text-zinc-700 mt-3">収容人数 {card.capacity}人</p>
      ) : null
  }
}

// 募集掲示板。カテゴリ・地域で絞り込んで募集カードを表示する
export function RecruitmentBoard({ cards }: { cards: RecruitmentCard[] }) {
  const [selectedCategory, setSelectedCategory] = useState<RecruitmentCategoryKey>("all")
  const [selectedPrefecture, setSelectedPrefecture] = useState("all")

  const filtered = cards.filter(
    (card) =>
      (selectedCategory === "all" || card.category === selectedCategory) &&
      (selectedPrefecture === "all" || card.prefecture === selectedPrefecture)
  )

  return (
    <section>
      {/* カテゴリフィルター（横スクロール対応） */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-2 -mx-4 px-4">
        {RECRUITMENT_CATEGORIES.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setSelectedCategory(c.key)}
            className={`shrink-0 whitespace-nowrap text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${
              selectedCategory === c.key
                ? "bg-blue-600 text-white"
                : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* 地域フィルター */}
      <div className="mb-3">
        <PrefectureSelect value={selectedPrefecture} onChange={setSelectedPrefecture} />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-xl p-8 text-center">
          <p className="text-sm text-zinc-400">募集はまだありません</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((card) => (
            <li key={card.id} className="bg-white border border-zinc-200 rounded-xl p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="inline-block text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium mb-1">
                    {CATEGORY_BADGE[card.category]}
                  </span>
                  <p className="text-xs text-zinc-400">{card.teamName}</p>
                  <CardBody card={card} />
                  <p className="text-xs text-zinc-400 mt-0.5">📍 {card.prefecture}</p>
                </div>
                <span
                  className={`shrink-0 text-xs px-1.5 py-0.5 rounded font-medium ${
                    card.status === "OPEN"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-zinc-100 text-zinc-500"
                  }`}
                >
                  {card.status === "OPEN" ? "募集中" : "募集終了"}
                </span>
              </div>

              <CardInfoLine card={card} />

              {card.note && (
                <p className="text-xs text-zinc-500 mt-1 whitespace-pre-wrap">
                  {card.note}
                </p>
              )}

              <Link
                href={DETAIL_PATH[card.category](card.id)}
                className="inline-block text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors mt-3"
              >
                詳細を見る
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
