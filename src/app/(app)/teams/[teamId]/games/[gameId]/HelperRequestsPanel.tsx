"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { PREFECTURES, DEFAULT_PREFECTURE } from "@/lib/prefectures"

type HelperRequestItem = {
  id: string
  positions: string | null
  count: number
  note: string | null
  contactEmail: string
  prefecture: string
  status: "OPEN" | "CLOSED"
}

// 管理者向け：助っ人募集の作成・応募者確認・締め切りを行うパネル
export function HelperRequestsPanel({
  gameId,
  initialRequests,
}: {
  gameId: string
  initialRequests: HelperRequestItem[]
}) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [closingId, setClosingId] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [, startTransition] = useTransition()

  const createRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (submitting) return

    const form = e.currentTarget
    const fd = new FormData(form)
    const positions = ((fd.get("positions") as string) ?? "").trim()
    const countRaw = ((fd.get("count") as string) ?? "").trim()
    const note = ((fd.get("note") as string) ?? "").trim()
    const contactEmail = ((fd.get("contactEmail") as string) ?? "").trim()
    const prefecture = ((fd.get("prefecture") as string) ?? "").trim()

    if (!countRaw) {
      setError("募集人数を入力してください")
      return
    }
    if (!contactEmail) {
      setError("代表者メールアドレスを入力してください")
      return
    }
    if (!prefecture) {
      setError("都道府県を選択してください")
      return
    }

    setSubmitting(true)
    setError("")

    try {
      const res = await fetch(`/api/games/${gameId}/helper-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          positions: positions === "" ? null : positions,
          count: Number(countRaw),
          note: note === "" ? null : note,
          contactEmail,
          prefecture,
        }),
      })
      const data = (await res.json()) as { error?: string }

      if (!res.ok) {
        setError(data.error ?? "募集の作成に失敗しました")
        return
      }

      form.reset()
      setShowForm(false)
      startTransition(() => router.refresh())
    } catch {
      setError("通信に失敗しました。ネットワークを確認してください")
    } finally {
      setSubmitting(false)
    }
  }

  const closeRequest = async (requestId: string) => {
    if (closingId) return
    setClosingId(requestId)
    setError("")

    try {
      const res = await fetch(
        `/api/games/${gameId}/helper-requests/${requestId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "CLOSED" }),
        }
      )
      const data = (await res.json()) as { error?: string }

      if (!res.ok) {
        setError(data.error ?? "締め切りに失敗しました")
        return
      }

      startTransition(() => router.refresh())
    } catch {
      setError("通信に失敗しました。ネットワークを確認してください")
    } finally {
      setClosingId(null)
    }
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-zinc-900">助っ人募集</h3>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          {showForm ? "閉じる" : "+ 募集を作成"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={createRequest}
          className="bg-white border border-zinc-200 rounded-xl p-4 mb-3 space-y-3"
        >
          <div>
            <label
              htmlFor="positions"
              className="block text-xs font-medium text-zinc-600 mb-1"
            >
              ポジション（任意）
            </label>
            <input
              id="positions"
              name="positions"
              type="text"
              maxLength={100}
              placeholder="例: ピッチャー、キャッチャー"
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            />
          </div>
          <div>
            <label
              htmlFor="count"
              className="block text-xs font-medium text-zinc-600 mb-1"
            >
              募集人数<span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              id="count"
              name="count"
              type="number"
              min={1}
              max={99}
              defaultValue={1}
              inputMode="numeric"
              required
              placeholder="例: 3"
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            />
          </div>
          <div>
            <label
              htmlFor="note"
              className="block text-xs font-medium text-zinc-600 mb-1"
            >
              メモ（任意）
            </label>
            <textarea
              id="note"
              name="note"
              rows={2}
              maxLength={500}
              placeholder="例: 経験者優先、当日18時集合"
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white resize-none"
            />
          </div>
          <div>
            <label
              htmlFor="contactEmail"
              className="block text-xs font-medium text-zinc-600 mb-1"
            >
              代表者メールアドレス<span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              id="contactEmail"
              name="contactEmail"
              type="email"
              maxLength={254}
              required
              placeholder="例: contact@example.com"
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            />
          </div>
          <div>
            <label
              htmlFor="prefecture"
              className="block text-xs font-medium text-zinc-600 mb-1"
            >
              都道府県<span className="text-red-500 ml-0.5">*</span>
            </label>
            <select
              id="prefecture"
              name="prefecture"
              required
              defaultValue={DEFAULT_PREFECTURE}
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              {PREFECTURES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "作成中..." : "募集を作成する"}
          </button>
        </form>
      )}

      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}

      {initialRequests.length === 0 ? (
        <p className="text-sm text-zinc-400 px-1">まだ募集はありません</p>
      ) : (
        <ul className="space-y-2">
          {initialRequests.map((r) => (
            <li
              key={r.id}
              className="bg-white border border-zinc-200 rounded-xl p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-zinc-900">
                    {r.positions ?? "ポジション指定なし"}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    募集人数 {r.count}人 ・ 📍 {r.prefecture}
                  </p>
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

              {r.note && (
                <p className="text-xs text-zinc-500 mt-2 whitespace-pre-wrap">
                  {r.note}
                </p>
              )}

              <p className="text-xs text-zinc-400 mt-2">
                お問い合わせ:{" "}
                <a
                  href={`mailto:${r.contactEmail}`}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                >
                  {r.contactEmail}
                </a>
              </p>

              {r.status === "OPEN" && (
                <button
                  type="button"
                  onClick={() => closeRequest(r.id)}
                  disabled={closingId === r.id}
                  className="mt-3 w-full text-xs text-zinc-500 border border-zinc-200 rounded-lg py-2 hover:bg-zinc-50 transition-colors disabled:opacity-50"
                >
                  {closingId === r.id ? "処理中..." : "募集を締め切る"}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
