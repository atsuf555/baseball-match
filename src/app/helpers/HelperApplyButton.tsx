"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

// 助っ人募集への応募ボタン。タップで即時にUIが変わり（楽観的更新）、
// 裏でAPIに保存する。保存に失敗したら元の状態に戻す。
export function HelperApplyButton({
  gameId,
  requestId,
  initialApplied,
}: {
  gameId: string
  requestId: string
  initialApplied: boolean
}) {
  const router = useRouter()
  const [applied, setApplied] = useState(initialApplied)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [, startTransition] = useTransition()

  const apply = async () => {
    if (applied || submitting) return

    setApplied(true) // ← 楽観的更新：先にUIを切り替える
    setSubmitting(true)
    setError("")

    try {
      const res = await fetch(
        `/api/games/${gameId}/helper-requests/${requestId}/apply`,
        { method: "POST" }
      )
      const data = (await res.json()) as { error?: string }

      if (!res.ok) {
        setApplied(false) // 失敗したら元に戻す
        setError(data.error ?? "応募に失敗しました")
        return
      }

      startTransition(() => router.refresh())
    } catch {
      setApplied(false)
      setError("通信に失敗しました。ネットワークを確認してください")
    } finally {
      setSubmitting(false)
    }
  }

  if (applied) {
    return (
      <span className="inline-flex items-center text-sm font-medium text-green-700 bg-green-50 px-3 py-1.5 rounded-lg">
        応募済み ✓
      </span>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={apply}
        disabled={submitting}
        className="bg-blue-600 text-white text-sm font-semibold px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {submitting ? "応募中..." : "応募する"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
