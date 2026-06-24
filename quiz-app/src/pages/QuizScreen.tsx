import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { collection, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useStore } from '../store/useStore'
import { Timer } from '../components/Timer'
import type { Question } from '../types'

interface AnswerRecord {
  questionId: string
  selectedAnswer: string
  timeSpentMs: number
}

export function QuizScreen() {
  const { setId } = useParams<{ setId: string }>()
  const navigate = useNavigate()
  const { nickname, department, setLastSubmission } = useStore()

  const [questions, setQuestions] = useState<(Question & { id: string })[]>([])
  const [settings, setSettings] = useState({ timerSeconds: 30 })
  const [loading, setLoading] = useState(true)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<AnswerRecord[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [shortAnswer, setShortAnswer] = useState('')
  const [timerKey, setTimerKey] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const [showTimeout, setShowTimeout] = useState(false)
  const [finished, setFinished] = useState(false)
  const questionStartRef = useRef(Date.now())

  useEffect(() => {
    if (!nickname) { navigate('/quiz'); return }
    if (!setId) return
    const fetch = async () => {
      const setSnap = await getDoc(doc(db, 'quizSets', setId))
      if (!setSnap.exists()) { navigate('/quiz'); return }
      setSettings(setSnap.data().settings)

      const snap = await getDocs(collection(db, 'quizSets', setId, 'questions'))
      const qs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Question & { id: string }))
      qs.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      setQuestions(qs)
      setLoading(false)
      setTimerRunning(true)
      questionStartRef.current = Date.now()
    }
    fetch()
  }, [setId, nickname, navigate])

  const handleNext = (answerVal: string | null, timeout = false) => {
    const timeSpent = Date.now() - questionStartRef.current
    const q = questions[currentIdx]
    const newAnswers = [
      ...answers,
      {
        questionId: q.id,
        selectedAnswer: answerVal ?? '',
        timeSpentMs: timeSpent,
      },
    ]
    setAnswers(newAnswers)

    if (timeout) {
      setShowTimeout(true)
      setTimeout(() => {
        setShowTimeout(false)
        advanceQuestion(newAnswers)
      }, 800)
    } else {
      advanceQuestion(newAnswers)
    }
  }

  const advanceQuestion = (newAnswers: AnswerRecord[]) => {
    setSelected(null)
    setShortAnswer('')
    if (currentIdx + 1 >= questions.length) {
      submitQuiz(newAnswers)
    } else {
      setCurrentIdx((i) => i + 1)
      setTimerKey((k) => k + 1)
      setTimerRunning(true)
      questionStartRef.current = Date.now()
    }
  }

  const handleSelect = (opt: string) => {
    if (selected) return
    setSelected(opt)
    setTimerRunning(false)
    setTimeout(() => handleNext(opt), 400)
  }

  const handleShortSubmit = () => {
    if (!shortAnswer.trim()) return
    setTimerRunning(false)
    handleNext(shortAnswer.trim())
  }

  const submitQuiz = async (finalAnswers: AnswerRecord[]) => {
    setFinished(true)
    const { addDoc, collection: col, updateDoc, doc: docRef, getDoc: gd, setDoc } = await import('firebase/firestore')

    const questionMap: Record<string, Question & { id: string }> = {}
    questions.forEach((q) => { questionMap[q.id] = q })

    const results = finalAnswers.map((a) => {
      const q = questionMap[a.questionId]
      const isCorrect = q
        ? q.type === 'short'
          ? a.selectedAnswer.trim().toLowerCase() === q.answer.trim().toLowerCase()
          : a.selectedAnswer === q.answer
        : false
      return { ...a, isCorrect, correctAnswer: q?.answer ?? '', explanation: q?.explanation ?? '' }
    })

    const score = results.filter((r) => r.isCorrect).length
    const totalTimeMs = finalAnswers.reduce((s, a) => s + a.timeSpentMs, 0)

    const submission = {
      nickname,
      department: department || '',
      score,
      totalQuestions: questions.length,
      totalTimeMs,
      submittedAt: Date.now(),
      answers: results,
    }

    const subRef = await addDoc(col(db, 'quizSets', setId!, 'submissions'), submission)

    const leaderRef = docRef(db, 'leaderboards', setId!)
    const leaderSnap = await gd(leaderRef)
    const existing: Array<{ nickname: string; department: string; score: number; totalTimeMs: number; submittedAt: number }> =
      leaderSnap.exists() ? (leaderSnap.data().rankings ?? []) : []

    const filtered = existing.filter((e) => e.nickname !== nickname)
    const newEntry = { nickname, department: department || '', score, totalTimeMs, submittedAt: Date.now() }
    const merged = [...filtered, newEntry]
      .sort((a, b) => b.score - a.score || a.totalTimeMs - b.totalTimeMs)
      .slice(0, 50)
      .map((e, i) => ({ ...e, rank: i + 1 }))

    await setDoc(leaderRef, { rankings: merged, updatedAt: Date.now() })

    const myRank = merged.findIndex((e) => e.nickname === nickname) + 1

    setLastSubmission({
      id: subRef.id,
      ...submission,
      answers: results,
    })

    navigate(`/result/${setId}?rank=${myRank}`)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400">퀴즈 불러오는 중...</div>
  if (finished) return <div className="min-h-screen flex items-center justify-center text-slate-400">결과 집계 중...</div>

  const q = questions[currentIdx]
  const progress = ((currentIdx) / questions.length) * 100

  return (
    <div className="min-h-screen flex flex-col px-4 py-6 max-w-2xl mx-auto">
      {showTimeout && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 fade-in">
          <div className="bg-red-900 border border-red-600 rounded-2xl px-8 py-6 text-center">
            <div className="text-4xl mb-2">⏰</div>
            <p className="text-red-300 font-bold text-xl">시간 초과!</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div className="flex-1 mr-4">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>{currentIdx + 1} / {questions.length}</span>
            <span>{nickname}</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <Timer
          key={timerKey}
          totalSeconds={settings.timerSeconds}
          running={timerRunning}
          onExpire={() => handleNext(null, true)}
        />
      </div>

      <div className="flex-1">
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 mb-6 slide-up" key={currentIdx}>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-8 h-8 rounded-full bg-indigo-600 text-white text-sm font-bold flex items-center justify-center">
              {currentIdx + 1}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-400">
              {q.type === 'multiple' ? '객관식' : '단답형'}
            </span>
          </div>
          <p className="text-white text-lg font-medium leading-relaxed">{q.question}</p>
        </div>

        {q.type === 'multiple' ? (
          <div className="space-y-3">
            {q.options?.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleSelect(opt)}
                disabled={!!selected}
                className={`w-full px-5 py-4 rounded-xl text-left text-sm font-medium transition-all duration-200 border ${
                  selected === opt
                    ? 'bg-indigo-600 border-indigo-500 text-white scale-[0.98]'
                    : selected
                    ? 'bg-slate-800 border-slate-700 text-slate-400 opacity-50'
                    : 'bg-slate-800 border-slate-700 text-white hover:border-indigo-500 hover:bg-slate-700'
                }`}
              >
                <span className="text-slate-500 mr-3">{String.fromCharCode(65 + i)}.</span>
                {opt}
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <input
              type="text"
              value={shortAnswer}
              onChange={(e) => setShortAnswer(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleShortSubmit()}
              placeholder="답을 입력하세요"
              className="w-full px-5 py-4 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
              autoFocus
            />
            <button
              onClick={handleShortSubmit}
              disabled={!shortAnswer.trim()}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold transition-colors"
            >
              제출
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
