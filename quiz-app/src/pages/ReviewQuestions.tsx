import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Question } from '../types'

export function ReviewQuestions() {
  const { setId } = useParams<{ setId: string }>()
  const navigate = useNavigate()
  const [questions, setQuestions] = useState<(Question & { id: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [accessCode, setAccessCode] = useState('')

  useEffect(() => {
    if (!setId) return
    const fetch = async () => {
      const snap = await getDocs(collection(db, 'quizSets', setId, 'questions'))
      const qs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Question & { id: string }))
      qs.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      setQuestions(qs)

      const setSnap = await import('firebase/firestore').then(({ getDoc }) =>
        getDoc(doc(db, 'quizSets', setId))
      )
      setAccessCode(setSnap.data()?.accessCode ?? '')
      setLoading(false)
    }
    fetch()
  }, [setId])

  const publish = async () => {
    if (!setId) return
    setPublishing(true)
    try {
      await updateDoc(doc(db, 'quizSets', setId), { status: 'active' })
      navigate('/admin')
    } catch (e) {
      alert('공개 실패: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setPublishing(false)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400">불러오는 중...</div>

  return (
    <div className="min-h-screen px-4 py-6 max-w-2xl mx-auto">
      <button onClick={() => navigate('/admin')} className="text-slate-400 hover:text-white text-sm mb-6">
        ← 대시보드
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">문제 검토</h1>
          <p className="text-slate-400 text-sm mt-1">{questions.length}개 문제 생성됨</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500 mb-1">세트 코드</div>
          <div className="font-mono text-lg font-bold text-indigo-400 bg-slate-800 px-3 py-1 rounded-lg">
            {accessCode}
          </div>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        {questions.map((q, idx) => (
          <div key={q.id} className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-7 h-7 rounded-full bg-indigo-600 text-white text-sm font-bold flex items-center justify-center shrink-0">
                {idx + 1}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-400">
                {q.type === 'multiple' ? '객관식' : '단답형'}
              </span>
            </div>
            <p className="text-white font-medium mb-3">{q.question}</p>
            {q.options && q.options.length > 0 && (
              <div className="space-y-2 mb-3">
                {q.options.map((opt, i) => (
                  <div
                    key={i}
                    className={`px-3 py-2 rounded-lg text-sm ${
                      opt === q.answer
                        ? 'bg-green-900/30 border border-green-700 text-green-300'
                        : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    {opt === q.answer && '✓ '}{opt}
                  </div>
                ))}
              </div>
            )}
            {q.type === 'short' && (
              <div className="px-3 py-2 rounded-lg bg-green-900/30 border border-green-700 text-green-300 text-sm mb-3">
                정답: {q.answer}
              </div>
            )}
            <div className="px-3 py-2 rounded-lg bg-slate-900/50 text-slate-400 text-xs">
              💡 {q.explanation}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={publish}
        disabled={publishing}
        className="w-full py-4 rounded-2xl bg-green-600 hover:bg-green-500 disabled:bg-slate-700 text-white font-bold text-lg transition-colors"
      >
        {publishing ? '공개 중...' : '🚀 퀴즈 공개하기'}
      </button>
    </div>
  )
}
