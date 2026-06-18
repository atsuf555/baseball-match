// チームの連絡先（SNS・メール）をアイコン付きリンクで表示する
// 値が無いものは表示しない
export function TeamContactLinks({
  twitterUrl,
  instagramUrl,
  contactEmail,
}: {
  twitterUrl: string | null
  instagramUrl: string | null
  contactEmail: string | null
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {twitterUrl && (
        <a
          href={twitterUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 transition-colors"
        >
          <span aria-hidden>𝕏</span> X (Twitter)
        </a>
      )}
      {instagramUrl && (
        <a
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 transition-colors"
        >
          <span aria-hidden>📷</span> Instagram
        </a>
      )}
      {contactEmail && (
        <a
          href={`mailto:${contactEmail}`}
          className="inline-flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 transition-colors"
        >
          <span aria-hidden>✉️</span> {contactEmail}
        </a>
      )}
    </div>
  )
}
