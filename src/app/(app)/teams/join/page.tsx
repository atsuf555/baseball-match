"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function JoinTeamPage() {
  const router = useRouter()
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (pending) return

    const inviteCode = code.trim()
    if (!inviteCode) {
      setError("招待コードを入力してください")
      return
    }

    setPending(true)
    setError("")

    try {
      const res = await fetch("/api/teams/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode }),
      })
      const data = (await res.json()) as {
        ok?: boolean
        error?: string
        teamId?: string
      }

      if (res.ok && data.teamId) {
        // 参加成功 → チーム詳細へ
        router.push(`/teams/${data.teamId}`)
        router.refresh()
        return
      }

      setError(data.error ?? "参加に失敗しました。時間をおいて再度お試しください")
      setPending(false)
    } catch {
      setError("通信に失敗しました。ネットワークを確認してください")
      setPending(false)
    }
  }

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
        <h1 className="font-semibold text-zinc-900">チームに参加</h1>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <p className="text-sm text-zinc-500 mb-5">
          チームの管理者から共有された6文字の招待コードを入力してください。
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* エラー表示 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3.5">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* 招待コード */}
          <div>
            <label
              htmlFor="inviteCode"
              className="block text-sm font-medium text-zinc-700 mb-1.5"
            >
              招待コード
              <span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              id="inviteCode"
              name="inviteCode"
              type="text"
              required
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="例: A3K9ZR"
              autoComplete="off"
              autoCapitalize="characters"
              inputMode="text"
              className="w-full border border-zinc-300 rounded-xl px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-white font-mono tracking-[0.4em] uppercase"
            />
          </div>

          {/* 送信ボタン */}
          <button
            type="submit"
            disabled={pending}
            className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-semibold text-base hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? "参加中..." : "チームに参加する"}
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
