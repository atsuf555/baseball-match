"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

const inputClass =
  "w-full border border-zinc-300 rounded-xl px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-white"

export function NewGameForm({ teamId }: { teamId: string }) {
  const router = useRouter()
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (pending) return

    const form = e.currentTarget
    const fd = new FormData(form)
    const startsAtLocal = (fd.get("startsAt") as string) ?? ""
    const location = ((fd.get("location") as string) ?? "").trim()
    const meetTime = (fd.get("meetTime") as string) ?? ""
    const capacityRaw = ((fd.get("capacity") as string) ?? "").trim()
    const note = ((fd.get("note") as string) ?? "").trim()

    if (!startsAtLocal) {
      setError("試合日時を入力してください")
      return
    }
    if (!location) {
      setError("場所を入力してください")
      return
    }
    if (!meetTime) {
      setError("集合時間を入力してください")
      return
    }

    setPending(true)
    setError("")

    try {
      const res = await fetch(`/api/teams/${teamId}/games`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // datetime-local の値はタイムゾーン無しなので、ブラウザのローカル時刻として
          // Date 化し ISO 文字列（UTC）に変換して送る
          startsAt: new Date(startsAtLocal).toISOString(),
          location,
          meetTime,
          capacity: capacityRaw === "" ? null : Number(capacityRaw),
          note: note === "" ? null : note,
        }),
      })
      const data = (await res.json()) as { gameId?: string; error?: string }

      if (res.ok && data.gameId) {
        router.push(`/teams/${teamId}/games/${data.gameId}`)
        router.refresh()
        return
      }

      setError(data.error ?? "試合の作成に失敗しました")
      setPending(false)
    } catch {
      setError("通信に失敗しました。ネットワークを確認してください")
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3.5">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* 試合日時 */}
      <div>
        <label htmlFor="startsAt" className="block text-sm font-medium text-zinc-700 mb-1.5">
          試合日時<span className="text-red-500 ml-0.5">*</span>
        </label>
        <input id="startsAt" name="startsAt" type="datetime-local" required className={inputClass} />
      </div>

      {/* 場所 */}
      <div>
        <label htmlFor="location" className="block text-sm font-medium text-zinc-700 mb-1.5">
          場所<span className="text-red-500 ml-0.5">*</span>
        </label>
        <input
          id="location"
          name="location"
          type="text"
          required
          maxLength={100}
          placeholder="例: 区民グラウンド A面"
          className={inputClass}
          autoComplete="off"
        />
      </div>

      {/* 集合時間 */}
      <div>
        <label htmlFor="meetTime" className="block text-sm font-medium text-zinc-700 mb-1.5">
          集合時間<span className="text-red-500 ml-0.5">*</span>
        </label>
        <input id="meetTime" name="meetTime" type="time" required className={inputClass} />
      </div>

      {/* 定員（任意） */}
      <div>
        <label htmlFor="capacity" className="block text-sm font-medium text-zinc-700 mb-1.5">
          定員<span className="text-zinc-400 text-xs font-normal ml-1">（任意）</span>
        </label>
        <input
          id="capacity"
          name="capacity"
          type="number"
          min={1}
          max={999}
          inputMode="numeric"
          placeholder="例: 15"
          className={inputClass}
        />
      </div>

      {/* メモ（任意） */}
      <div>
        <label htmlFor="note" className="block text-sm font-medium text-zinc-700 mb-1.5">
          メモ<span className="text-zinc-400 text-xs font-normal ml-1">（任意）</span>
        </label>
        <textarea
          id="note"
          name="note"
          rows={3}
          maxLength={500}
          placeholder="例: スパイク不可。雨天の場合は前日に連絡します。"
          className={`${inputClass} resize-none`}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-semibold text-base hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending ? "作成中..." : "試合を作成する"}
      </button>

      <Link
        href={`/teams/${teamId}`}
        className="block text-center text-sm text-zinc-500 hover:text-zinc-700 transition-colors py-1"
      >
        キャンセル
      </Link>
    </form>
  )
}
