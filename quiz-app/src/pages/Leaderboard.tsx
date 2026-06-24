import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useStore } from '../store/useStore'
import type { LeaderboardEntry } from '../store/useStore'

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const sec = s % 60
  return m > 0 ? `${m}분 ${sec}초` : `${sec}초`
}

const rankMedal: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

export function Leaderboard() {
  const { setId } = useParams<{ setId: string }>()
  const navigate = useNavigate()
  const nickname = useStore((s) => s.nickname)
  const [rankings, setRankings] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!setId) return
    const unsub = onSnapshot(doc(db, 'leaderboards', setId), (snap) => {
      if (snap.exists()) {
        setRankings(snap.data().rankings ?? [])
      }
      setLoading(false)
    })
    return unsub
  }, [setId])

  return (
    <div className="min-h-screen px-4 py-6 max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white text-sm mb-6">
        ← 돌아가기
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="text-3xl">🏆</div>
        <div>
          <h1 className="text-2xl font-bold text-white">리더보드</h1>
          <p className="text-slate-400 text-sm">실시간 업데이트</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">불러오는 중...</div>
      ) : rankings.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-slate-400">아직 참여자가 없습니다</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rankings.map((entry) => {
            const isMe = entry.nickname === nickname
            return (
              <div
                key={entry.rank}
                className={`rounded-2xl p-4 border flex items-center gap-4 transition-all ${
                  isMe
                    ? 'bg-indigo-900/30 border-indigo-600 ring-1 ring-indigo-500'
                    : 'bg-slate-800 border-slate-700'
                }`}
              >
                <div className="w-10 text-center">
                  {rankMedal[entry.rank] ? (
                    <span className="text-2xl">{rankMedal[entry.rank]}</span>
                  ) : (
                    <span className="text-slate-400 font-bold">#{entry.rank}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${isMe ? 'text-indigo-300' : 'text-white'}`}>
                      {entry.nickname}
                      {isMe && <span className="ml-1 text-xs text-indigo-400">(나)</span>}
                    </span>
                    {entry.department && (
                      <span className="text-xs text-slate-500">{entry.department}</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{formatTime(entry.totalTimeMs)}</div>
                </div>
                <div className="text-right">
                  <div className={`text-xl font-bold ${isMe ? 'text-indigo-300' : 'text-white'}`}>
                    {entry.score}점
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-6">
        <button
          onClick={() => navigate('/')}
          className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-medium transition-colors"
        >
          홈으로
        </button>
      </div>
    </div>
  )
}
