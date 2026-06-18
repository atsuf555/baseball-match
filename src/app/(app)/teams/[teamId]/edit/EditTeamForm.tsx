"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

const inputClass =
  "w-full border border-zinc-300 rounded-xl px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-white"

type Initial = {
  twitterUrl: string | null
  instagramUrl: string | null
  contactEmail: string | null
}

export function EditTeamForm({ teamId, initial }: { teamId: string; initial: Initial }) {
  const router = useRouter()
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (pending) return

    const fd = new FormData(e.currentTarget)
    const twitterUrl = ((fd.get("twitterUrl") as string) ?? "").trim()
    const instagramUrl = ((fd.get("instagramUrl") as string) ?? "").trim()
    const contactEmail = ((fd.get("contactEmail") as string) ?? "").trim()

    setPending(true)
    setError("")

    try {
      const res = await fetch(`/api/teams/${teamId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          twitterUrl: twitterUrl === "" ? null : twitterUrl,
          instagramUrl: instagramUrl === "" ? null : instagramUrl,
          contactEmail: contactEmail === "" ? null : contactEmail,
        }),
      })
      const data = (await res.json()) as { ok?: boolean; error?: string }

      if (res.ok && data.ok) {
        router.push(`/teams/${teamId}`)
        router.refresh()
        return
      }

      setError(data.error ?? "更新に失敗しました")
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

      <div>
        <label htmlFor="twitterUrl" className="block text-sm font-medium text-zinc-700 mb-1.5">
          X (Twitter) URL<span className="text-zinc-400 text-xs font-normal ml-1">（任意）</span>
        </label>
        <input
          id="twitterUrl"
          name="twitterUrl"
          type="url"
          defaultValue={initial.twitterUrl ?? ""}
          placeholder="https://x.com/your_team"
          className={inputClass}
          autoComplete="off"
        />
      </div>

      <div>
        <label htmlFor="instagramUrl" className="block text-sm font-medium text-zinc-700 mb-1.5">
          Instagram URL<span className="text-zinc-400 text-xs font-normal ml-1">（任意）</span>
        </label>
        <input
          id="instagramUrl"
          name="instagramUrl"
          type="url"
          defaultValue={initial.instagramUrl ?? ""}
          placeholder="https://instagram.com/your_team"
          className={inputClass}
          autoComplete="off"
        />
      </div>

      <div>
        <label htmlFor="contactEmail" className="block text-sm font-medium text-zinc-700 mb-1.5">
          連絡用メールアドレス
          <span className="text-zinc-400 text-xs font-normal ml-1">（任意）</span>
        </label>
        <input
          id="contactEmail"
          name="contactEmail"
          type="email"
          defaultValue={initial.contactEmail ?? ""}
          placeholder="team@example.com"
          className={inputClass}
          autoComplete="off"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-semibold text-base hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending ? "保存中..." : "保存する"}
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
