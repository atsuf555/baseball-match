import Link from "next/link"

type TeamListItem = {
  id: string
  name: string
  description: string | null
  _count: { members: number }
}

// チーム一覧の表示。ホーム画面が募集掲示板になったことにより現在は呼び出されていないが、
// 将来再表示する可能性があるため削除せずコンポーネントとして残している
export function TeamListSection({ teams }: { teams: TeamListItem[] }) {
  return (
    <section>
      <h2 className="text-base font-semibold text-zinc-900 mb-3">チーム一覧</h2>
      {teams.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-xl p-6 text-center">
          <p className="text-sm text-zinc-400">まだチームが登録されていません</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {teams.map((team) => (
            <li key={team.id}>
              <Link
                href={`/teams/${team.id}`}
                className="block bg-white border border-zinc-200 rounded-xl p-4 hover:border-zinc-300 transition-colors"
              >
                <h3 className="font-semibold text-zinc-900 truncate">{team.name}</h3>
                {team.description && (
                  <p className="text-sm text-zinc-500 mt-1 line-clamp-2">
                    {team.description}
                  </p>
                )}
                <p className="text-xs text-zinc-400 mt-2">
                  メンバー {team._count.members}人
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
