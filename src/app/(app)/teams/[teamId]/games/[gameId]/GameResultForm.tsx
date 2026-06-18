"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

const inputClass =
  "w-full border border-zinc-300 rounded-xl px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-white"

type Initial = {
  opponentName: string | null
  ourScore: number | null
  opponentScore: number | null
  tournamentName: string | null
  summary: string | null
}

// 試合結果の入力・編集フォーム（管理者専用）。
// WIN/LOSE/DRAW はサーバー側でスコアから自動計算されるため、ここでは入力しない
export function GameResultForm({ gameId, initial }: { gameId: string; initial: Initial }) {
  const router = useRouter()
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (pending) return

    const fd = new FormData(e.currentTarget)
    const opponentName = ((fd.get("opponentName") as string) ?? "").trim()
    const ourScore = (fd.get("ourScore") as string) ?? ""
    const opponentScore = (fd.get("opponentScore") as string) ?? ""
    const tournamentName = ((fd.get("tournamentName") as string) ?? "").trim()
    const summary = ((fd.get("summary") as string) ?? "").trim()

    if (!opponentName) {
      setError("対戦相手名を入力してください")
      return
    }
    if (ourScore === "" || opponentScore === "") {
      setError("スコアを入力してください")
      return
    }

    setPending(true)
    setError("")

    try {
      const res = await fetch(`/api/games/${gameId}/result`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opponentName,
          ourScore: Number(ourScore),
          opponentScore: Number(opponentScore),
          tournamentName: tournamentName === "" ? null : tournamentName,
          summary: summary === "" ? null : summary,
        }),
      })
      const data = (await res.json()) as { ok?: boolean; error?: string }

      if (res.ok && data.ok) {
        router.refresh()
        return
      }

      setError(data.error ?? "保存に失敗しました")
    } catch {
      setError("通信に失敗しました。ネットワークを確認してください")
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3.5">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div>
        <label htmlFor="opponentName" className="block text-sm font-medium text-zinc-700 mb-1.5">
          対戦相手<span className="text-red-500 ml-0.5">*</span>
        </label>
        <input
          id="opponentName"
          name="opponentName"
          type="text"
          required
          maxLength={50}
          defaultValue={initial.opponentName ?? ""}
          placeholder="例: 渋谷タイガース"
          className={inputClass}
          autoComplete="off"
        />
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <label htmlFor="ourScore" className="block text-sm font-medium text-zinc-700 mb-1.5">
            自チーム<span className="text-red-500 ml-0.5">*</span>
          </label>
          <input
            id="ourScore"
            name="ourScore"
            type="number"
            required
            min={0}
            max={999}
            inputMode="numeric"
            defaultValue={initial.ourScore ?? ""}
            className={inputClass}
          />
        </div>
        <span className="text-zinc-400 font-semibold mt-6">-</span>
        <div className="flex-1">
          <label htmlFor="opponentScore" className="block text-sm font-medium text-zinc-700 mb-1.5">
            相手<span className="text-red-500 ml-0.5">*</span>
          </label>
          <input
            id="opponentScore"
            name="opponentScore"
            type="number"
            required
            min={0}
            max={999}
            inputMode="numeric"
            defaultValue={initial.opponentScore ?? ""}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="tournamentName" className="block text-sm font-medium text-zinc-700 mb-1.5">
          大会名<span className="text-zinc-400 text-xs font-normal ml-1">（任意）</span>
        </label>
        <input
          id="tournamentName"
          name="tournamentName"
          type="text"
          maxLength={50}
          defaultValue={initial.tournamentName ?? ""}
          placeholder="例: 区民リーグ春季大会"
          className={inputClass}
          autoComplete="off"
        />
      </div>

      <div>
        <label htmlFor="summary" className="block text-sm font-medium text-zinc-700 mb-1.5">
          戦評<span className="text-zinc-400 text-xs font-normal ml-1">（任意）</span>
        </label>
        <textarea
          id="summary"
          name="summary"
          rows={3}
          maxLength={1000}
          defaultValue={initial.summary ?? ""}
          placeholder="例: 終盤の集中打で逆転勝利。先発が7回を2失点に抑えた。"
          className={`${inputClass} resize-none`}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending ? "保存中..." : "結果を保存する"}
      </button>
    </form>
  )
}
