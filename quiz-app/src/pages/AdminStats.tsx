import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { collection, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

interface Submission {
  id: string
  nickname: string
  department: string
  score: number
  totalQuestions: number
  totalTimeMs: number
  submittedAt: number
}

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const sec = s % 60
  return m > 0 ? `${m}분 ${sec}초` : `${sec}초`
}

export function AdminStats() {
  const { setId } = useParams<{ setId: string }>()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!setId) return
    const fetch = async () => {
      const setSnap = await getDoc(doc(db, 'quizSets', setId))
      setTitle(setSnap.data()?.title ?? '알 수 없는 퀴즈')

      const snap = await getDocs(collection(db, 'quizSets', setId, 'submissions'))
      const subs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Submission))
      subs.sort((a, b) => b.score - a.score || a.totalTimeMs - b.totalTimeMs)
      setSubmissions(subs)
      setLoading(false)
    }
    fetch()
  }, [setId])

  const avg = submissions.length > 0
    ? Math.round(submissions.reduce((s, sub) => s + (sub.score / sub.totalQuestions) * 100, 0) / submissions.length)
    : 0

  return (
    <div className="min-h-screen px-4 py-6 max-w-2xl mx-auto">
      <button onClick={() => navigate('/admin')} className="text-slate-400 hover:text-white text-sm mb-6">
        ← 대시보드
      </button>

      <h1 className="text-2xl font-bold text-white mb-1">응시 통계</h1>
      <p className="text-slate-400 text-sm mb-6">{title}</p>

      {loading ? (
        <div className="text-center py-16 text-slate-400">불러오는 중...</div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 text-center">
              <div className="text-3xl font-bold text-indigo-400">{submissions.length}</div>
              <div className="text-xs text-slate-400 mt-1">응시 인원</div>
            </div>
            <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 text-center">
              <div className="text-3xl font-bold text-lime-400">{avg}%</div>
              <div className="text-xs text-slate-400 mt-1">평균 정답률</div>
            </div>
            <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 text-center">
              <div className="text-3xl font-bold text-amber-400">
                {submissions.length > 0 ? Math.round(submissions.reduce((s, sub) => s + sub.score, 0) / submissions.length * 10) / 10 : 0}
              </div>
              <div className="text-xs text-slate-400 mt-1">평균 점수</div>
            </div>
          </div>

          {submissions.length === 0 ? (
            <div className="text-center py-10 text-slate-400">아직 응시자가 없습니다</div>
          ) : (
            <div className="space-y-2">
              {submissions.map((sub, idx) => (
                <div key={sub.id} className="bg-slate-800 rounded-xl p-4 border border-slate-700 flex items-center gap-3">
                  <span className="text-slate-500 font-mono text-sm w-6">{idx + 1}</span>
                  <div className="flex-1">
                    <div className="text-white font-medium">{sub.nickname}</div>
                    {sub.department && <div className="text-slate-500 text-xs">{sub.department}</div>}
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold">{sub.score}/{sub.totalQuestions}</div>
                    <div className="text-slate-500 text-xs">{formatTime(sub.totalTimeMs)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
