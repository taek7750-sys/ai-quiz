import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, doc, updateDoc, orderBy, query } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useStore } from '../store/useStore'
import type { QuizSet } from '../store/useStore'

const statusLabel: Record<string, string> = {
  draft: '초안',
  active: '공개중',
  closed: '종료',
}
const statusColor: Record<string, string> = {
  draft: 'bg-slate-700 text-slate-300',
  active: 'bg-green-900/50 text-green-400',
  closed: 'bg-red-900/50 text-red-400',
}

export function AdminDashboard() {
  const navigate = useNavigate()
  const setIsAdmin = useStore((s) => s.setIsAdmin)
  const [quizSets, setQuizSets] = useState<QuizSet[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSets = async () => {
    setLoading(true)
    try {
      const q = query(collection(db, 'quizSets'), orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)
      const sets = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as QuizSet))
      setQuizSets(sets)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSets() }, [])

  const toggleStatus = async (set: QuizSet) => {
    const nextStatus = set.status === 'active' ? 'closed' : 'active'
    await updateDoc(doc(db, 'quizSets', set.id), { status: nextStatus })
    fetchSets()
  }

  const logout = () => {
    setIsAdmin(false)
    navigate('/')
  }

  return (
    <div className="min-h-screen px-4 py-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">관리자 대시보드</h1>
          <p className="text-slate-400 text-sm mt-1">퀴즈 세트 관리</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/admin/create')}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-colors"
          >
            + 새 퀴즈 생성
          </button>
          <button
            onClick={logout}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-medium text-sm transition-colors"
          >
            로그아웃
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">불러오는 중...</div>
      ) : quizSets.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-4">📋</div>
          <p className="text-slate-400 mb-4">생성된 퀴즈 세트가 없습니다</p>
          <button
            onClick={() => navigate('/admin/create')}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
          >
            첫 퀴즈 만들기
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {quizSets.map((set) => (
            <div key={set.id} className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[set.status]}`}>
                      {statusLabel[set.status]}
                    </span>
                    <span className="text-xs text-slate-500">#{set.accessCode}</span>
                  </div>
                  <h3 className="text-white font-semibold text-lg truncate">{set.title}</h3>
                  <div className="flex gap-3 mt-2 text-xs text-slate-400">
                    <span>📝 {set.settings?.questionCount}문제</span>
                    <span>⏱ {set.settings?.timerSeconds}초</span>
                    <span>🎯 {set.settings?.difficulty === 'easy' ? '쉬움' : set.settings?.difficulty === 'medium' ? '보통' : '어려움'}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => navigate(`/admin/stats/${set.id}`)}
                    className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-medium transition-colors whitespace-nowrap"
                  >
                    📊 통계
                  </button>
                  <button
                    onClick={() => toggleStatus(set)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                      set.status === 'active'
                        ? 'bg-red-900/40 hover:bg-red-900/60 text-red-400'
                        : 'bg-green-900/40 hover:bg-green-900/60 text-green-400'
                    }`}
                  >
                    {set.status === 'active' ? '비공개로' : '공개로'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
