"use client"

import { useActionState } from "react"
import { createTeam, type TeamActionState } from "@/actions/team"
import Link from "next/link"

const initialState: TeamActionState = { ok: false, error: "" }

export default function NewTeamPage() {
  const [state, formAction, pending] = useActionState(createTeam, initialState)

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-zinc-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Link
          href="/dashboard"
          className="text-zinc-500 hover:text-zinc-700 transition-colors p-1 -ml-1"
          aria-label="戻る"
        >
          ←
        </Link>
        <h1 className="font-semibold text-zinc-900">チームを作成</h1>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <form action={formAction} className="space-y-5">
          {/* エラー表示 */}
          {state.error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3.5">
              <p className="text-sm text-red-600">{state.error}</p>
            </div>
          )}

          {/* チーム名 */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-zinc-700 mb-1.5"
            >
              チーム名
              <span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              maxLength={50}
              placeholder="例: 渋谷ベアーズ"
              className="w-full border border-zinc-300 rounded-xl px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-white"
              autoComplete="off"
            />
          </div>

          {/* 説明 */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-zinc-700 mb-1.5"
            >
              チーム説明
              <span className="text-zinc-400 text-xs font-normal ml-1">
                （任意）
              </span>
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              maxLength={200}
              placeholder="例: 毎週日曜日に活動する草野球チームです"
              className="w-full border border-zinc-300 rounded-xl px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-base bg-white"
            />
            <p className="text-xs text-zinc-400 mt-1 text-right">200文字以内</p>
          </div>

          {/* 送信ボタン */}
          <button
            type="submit"
            disabled={pending}
            className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-semibold text-base hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? "作成中..." : "チームを作成する"}
          </button>

          {/* キャンセル */}
          <Link
            href="/dashboard"
            className="block text-center text-sm text-zinc-500 hover:text-zinc-700 transition-colors py-1"
          >
            キャンセル
          </Link>
        </form>
      </main>
    </div>
  )
}
