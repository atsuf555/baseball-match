"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  ATTENDANCE_META,
  ATTENDANCE_STATUSES,
  type AttendanceStatusValue,
} from "@/lib/attendance"

// 自分の出欠回答ボタン。タップでは選択状態を切り替えるだけで、
// 「決定」ボタンを押した時点でAPIに保存する（楽観的更新）。
// 保存に失敗したら確定済みの状態に戻す。
export function AttendancePanel({
  gameId,
  initialStatus,
}: {
  gameId: string
  initialStatus: AttendanceStatusValue | null
}) {
  const router = useRouter()
  // saved: サーバーに確定済みの回答 / selected: ボタンで選んだだけの未確定の値
  const [saved, setSaved] = useState<AttendanceStatusValue | null>(initialStatus)
  const [selected, setSelected] = useState<AttendanceStatusValue | null>(initialStatus)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [, startTransition] = useTransition()

  const isDirty = selected !== null && selected !== saved

  const confirm = async () => {
    if (!selected || !isDirty || submitting) return

    setSubmitting(true)
    setError("")

    try {
      const res = await fetch(`/api/games/${gameId}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: selected }),
      })
      const data = (await res.json()) as { error?: string }

      if (!res.ok) {
        setError(data.error ?? "保存に失敗しました")
        return
      }

      setSaved(selected) // ← 決定が成功した時点で確定状態に反映（楽観的更新）

      // 管理者の集計・名簿（Server Component）を更新する
      startTransition(() => router.refresh())
    } catch {
      setError("通信に失敗しました。ネットワークを確認してください")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section>
      <h3 className="text-sm font-semibold text-zinc-900 mb-2">あなたの出欠</h3>

      <div className="grid grid-cols-3 gap-2">
        {ATTENDANCE_STATUSES.map((value) => {
          const meta = ATTENDANCE_META[value]
          const active = selected === value
          return (
            <button
              key={value}
              type="button"
              onClick={() => setSelected(value)}
              aria-pressed={active}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl border py-4 transition-colors ${
                active
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              <span className="text-2xl leading-none">{meta.emoji}</span>
              <span className="text-sm font-semibold">{meta.label}</span>
            </button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={confirm}
        disabled={!isDirty || submitting}
        className={`mt-3 w-full rounded-xl py-3 text-sm font-semibold transition-colors ${
          !isDirty || submitting
            ? "bg-zinc-100 text-zinc-400 cursor-not-allowed"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
      >
        {submitting ? "送信中…" : "決定"}
      </button>

      <p className="mt-2 text-center text-xs text-zinc-400">
        {saved
          ? isDirty
            ? "「決定」を押すと回答が変更されます"
            : "タップして「決定」を押すといつでも変更できます"
          : selected
            ? "「決定」を押すと回答が保存されます"
            : "まだ回答していません。タップして回答してください"}
      </p>

      {error && (
        <p className="mt-1 text-center text-xs text-red-600">{error}</p>
      )}
    </section>
  )
}
