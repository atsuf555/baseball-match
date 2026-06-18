"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { formatGameDateTime } from "@/lib/utils"
import { PREFECTURES, DEFAULT_PREFECTURE } from "@/lib/prefectures"

type GroundOfferItem = {
  id: string
  groundName: string
  location: string
  date: string
  capacity: number | null
  note: string | null
  contactEmail: string
  prefecture: string
  status: "OPEN" | "CLOSED"
}

// 管理者向け：グラウンド譲渡の作成・締め切りを行うパネル
export function GroundOffersPanel({
  teamId,
  initialOffers,
}: {
  teamId: string
  initialOffers: GroundOfferItem[]
}) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [closingId, setClosingId] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [, startTransition] = useTransition()

  const createOffer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (submitting) return

    const form = e.currentTarget
    const fd = new FormData(form)
    const groundName = ((fd.get("groundName") as string) ?? "").trim()
    const location = ((fd.get("location") as string) ?? "").trim()
    const date = ((fd.get("date") as string) ?? "").trim()
    const capacityRaw = ((fd.get("capacity") as string) ?? "").trim()
    const note = ((fd.get("note") as string) ?? "").trim()
    const contactEmail = ((fd.get("contactEmail") as string) ?? "").trim()
    const prefecture = ((fd.get("prefecture") as string) ?? "").trim()

    if (!groundName) {
      setError("グラウンド名を入力してください")
      return
    }
    if (!location) {
      setError("場所・住所を入力してください")
      return
    }
    if (!date) {
      setError("譲渡希望日時を入力してください")
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
      const res = await fetch(`/api/teams/${teamId}/ground-offers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groundName,
          location,
          date,
          capacity: capacityRaw === "" ? null : Number(capacityRaw),
          note: note === "" ? null : note,
          contactEmail,
          prefecture,
        }),
      })
      const data = (await res.json()) as { error?: string }

      if (!res.ok) {
        setError(data.error ?? "作成に失敗しました")
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

  const closeOffer = async (offerId: string) => {
    if (closingId) return
    setClosingId(offerId)
    setError("")

    try {
      const res = await fetch(`/api/teams/${teamId}/ground-offers/${offerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CLOSED" }),
      })
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
        <h3 className="text-sm font-semibold text-zinc-900">グラウンド譲渡</h3>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          {showForm ? "閉じる" : "+ 譲渡を作成"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={createOffer}
          className="bg-white border border-zinc-200 rounded-xl p-4 mb-3 space-y-3"
        >
          <div>
            <label
              htmlFor="groundName"
              className="block text-xs font-medium text-zinc-600 mb-1"
            >
              グラウンド名<span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              id="groundName"
              name="groundName"
              type="text"
              maxLength={100}
              required
              placeholder="例: 市営第一球場"
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            />
          </div>
          <div>
            <label
              htmlFor="location"
              className="block text-xs font-medium text-zinc-600 mb-1"
            >
              場所・住所<span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              id="location"
              name="location"
              type="text"
              maxLength={200}
              required
              placeholder="例: 東京都千代田区1-1-1"
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            />
          </div>
          <div>
            <label
              htmlFor="date"
              className="block text-xs font-medium text-zinc-600 mb-1"
            >
              譲渡希望日時<span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              id="date"
              name="date"
              type="datetime-local"
              required
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            />
          </div>
          <div>
            <label
              htmlFor="capacity"
              className="block text-xs font-medium text-zinc-600 mb-1"
            >
              収容人数（任意）
            </label>
            <input
              id="capacity"
              name="capacity"
              type="number"
              min={1}
              inputMode="numeric"
              placeholder="例: 50"
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
              placeholder="例: 雨天中止、駐車場あり"
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
            {submitting ? "作成中..." : "譲渡を作成する"}
          </button>
        </form>
      )}

      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}

      {initialOffers.length === 0 ? (
        <p className="text-sm text-zinc-400 px-1">まだ譲渡はありません</p>
      ) : (
        <ul className="space-y-2">
          {initialOffers.map((o) => (
            <li
              key={o.id}
              className="bg-white border border-zinc-200 rounded-xl p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-zinc-900">
                    {o.groundName}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {o.location} ・ {formatGameDateTime(new Date(o.date))}
                    {o.capacity != null && ` ・ 収容${o.capacity}人`}
                    {` ・ 📍 ${o.prefecture}`}
                  </p>
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

              {o.note && (
                <p className="text-xs text-zinc-500 mt-2 whitespace-pre-wrap">
                  {o.note}
                </p>
              )}

              <p className="text-xs text-zinc-400 mt-2">
                お問い合わせ:{" "}
                <a
                  href={`mailto:${o.contactEmail}`}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                >
                  {o.contactEmail}
                </a>
              </p>

              {o.status === "OPEN" && (
                <button
                  type="button"
                  onClick={() => closeOffer(o.id)}
                  disabled={closingId === o.id}
                  className="mt-3 w-full text-xs text-zinc-500 border border-zinc-200 rounded-lg py-2 hover:bg-zinc-50 transition-colors disabled:opacity-50"
                >
                  {closingId === o.id ? "処理中..." : "募集を締め切る"}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
