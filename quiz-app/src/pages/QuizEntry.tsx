import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useStore } from '../store/useStore'

interface QuizSetPreview {
  id: string
  title: string
  accessCode: string
  status: string
  settings: {
    questionCount: number
    difficulty: 'easy' | 'medium' | 'hard'
    timerSeconds: number
  }
  createdAt: number
}

const diffLabel: Record<string, string> = { easy: '쉬움', medium: '보통', hard: '어려움' }
const diffColor: Record<string, string> = {
  easy: 'text-green-400',
  medium: 'text-yellow-400',
  hard: 'text-red-400',
}

export function QuizEntry() {
  const navigate = useNavigate()
  const { setNickname, setDepartment, setCurrentSetId } = useStore()

  const [step, setStep] = useState<'nickname' | 'select'>('nickname')
  const [nickname, setNicknameLocal] = useState('')
  const [department, setDepartmentLocal] = useState('')
  const [error, setError] = useState('')
  const [listError, setListError] = useState('')
  const [quizList, setQuizList] = useState<QuizSetPreview[]>([])
  const [listLoading, setListLoading] = useState(false)

  const fetchQuizList = async () => {
    setListLoading(true)
    setListError('')
    try {
      // 먼저 복합 인덱스 쿼리 시도
      const q = query(
        collection(db, 'quizSets'),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc')
      )
      const snap = await getDocs(q)
      setQuizList(snap.docs.map((d) => ({ id: d.id, ...d.data() } as QuizSetPreview)))
    } catch (e1) {
      // 복합 인덱스 없으면 orderBy 없이 재시도
      try {
        const q2 = query(collection(db, 'quizSets'), where('status', '==', 'active'))
        const snap2 = await getDocs(q2)
        const list = snap2.docs.map((d) => ({ id: d.id, ...d.data() } as QuizSetPreview))
        list.sort((a, b) => b.createdAt - a.createdAt)
        setQuizList(list)
      } catch (e2) {
        // 그래도 실패하면 전체 목록 시도 (Firestore 규칙 문제 확인용)
        try {
          const snap3 = await getDocs(collection(db, 'quizSets'))
          const list = snap3.docs
            .map((d) => ({ id: d.id, ...d.data() } as QuizSetPreview))
            .filter((d) => d.status === 'active')
          list.sort((a, b) => b.createdAt - a.createdAt)
          setQuizList(list)
        } catch (e3) {
          const msg = e3 instanceof Error ? e3.message : String(e3)
          setListError(`퀴즈 목록을 불러올 수 없습니다: ${msg}`)
        }
      }
    } finally {
      setListLoading(false)
    }
  }

  const handleNicknameNext = () => {
    const trimmed = nickname.trim()
    if (trimmed.length < 2) { setError('닉네임은 2자 이상이어야 합니다.'); return }
    if (trimmed.length > 10) { setError('닉네임은 10자 이하여야 합니다.'); return }
    setNickname(trimmed)
    setDepartment(department.trim())
    setError('')
    setStep('select')
    fetchQuizList()
  }

  const handleSelectQuiz = (quizId: string) => {
    setCurrentSetId(quizId)
    navigate(`/quiz/${quizId}`)
  }


  return (
    <div className="min-h-screen px-4 py-6 max-w-lg mx-auto">
      {/* Step 1 — 닉네임 */}
      {step === 'nickname' && (
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-full slide-up">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 mb-4">
                <span className="text-3xl">🎯</span>
              </div>
              <h2 className="text-2xl font-bold text-white">참여자 정보 입력</h2>
              <p className="text-slate-400 mt-1 text-sm">리더보드에 표시될 이름을 입력해주세요</p>
            </div>

            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 space-y-4">
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">닉네임 *</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => { setNicknameLocal(e.target.value); setError('') }}
                  onKeyDown={(e) => e.key === 'Enter' && handleNicknameNext()}
                  placeholder="2~10자 입력"
                  maxLength={10}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">부서/팀 (선택)</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartmentLocal(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleNicknameNext()}
                  placeholder="예: 인사팀, 마케팅"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button
                onClick={handleNicknameNext}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
              >
                다음 →
              </button>
            </div>

            <button onClick={() => navigate('/')} className="w-full mt-4 text-slate-500 hover:text-slate-300 text-sm transition-colors">
              ← 홈으로
            </button>
          </div>
        </div>
      )}

      {/* Step 2 — 퀴즈 선택 */}
      {step === 'select' && (
        <div className="slide-up">
          <div className="flex items-center justify-between mb-6 pt-2">
            <div>
              <h2 className="text-2xl font-bold text-white">퀴즈 선택</h2>
              <p className="text-slate-400 text-sm mt-0.5">
                <span className="text-indigo-400 font-medium">{nickname}</span>님, 풀 퀴즈를 선택하세요
              </p>
            </div>
            <button
              onClick={() => { setStep('nickname'); setError('') }}
              className="text-slate-500 hover:text-slate-300 text-sm transition-colors"
            >
              ← 수정
            </button>
          </div>

          {/* 공개 퀴즈 목록 */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold">공개된 퀴즈 목록</h3>
            <button
              onClick={fetchQuizList}
              className="text-slate-500 hover:text-slate-300 text-xs transition-colors"
            >
              🔄 새로고침
            </button>
          </div>

          {listLoading ? (
            <div className="py-12 text-center">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-slate-400 text-sm">퀴즈 목록 불러오는 중...</p>
            </div>
          ) : listError ? (
            <div className="py-8 text-center bg-red-900/20 rounded-2xl border border-red-800 px-4">
              <div className="text-3xl mb-3">⚠️</div>
              <p className="text-red-400 text-sm font-medium mb-1">목록을 불러올 수 없습니다</p>
              <p className="text-slate-500 text-xs">{listError}</p>
              <button onClick={fetchQuizList} className="mt-3 text-indigo-400 hover:text-indigo-300 text-xs">
                다시 시도
              </button>
            </div>
          ) : quizList.length === 0 ? (
            <div className="py-12 text-center bg-slate-800/50 rounded-2xl border border-slate-700">
              <div className="text-3xl mb-3">📭</div>
              <p className="text-slate-400 text-sm">현재 공개된 퀴즈가 없습니다</p>
              <p className="text-slate-600 text-xs mt-1">관리자 페이지에서 퀴즈를 공개 상태로 변경해주세요</p>
            </div>
          ) : (
            <div className="space-y-3">
              {quizList.map((quiz) => (
                <button
                  key={quiz.id}
                  onClick={() => handleSelectQuiz(quiz.id)}
                  className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-indigo-500 rounded-2xl p-5 text-left transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-semibold text-base truncate group-hover:text-indigo-300 transition-colors">
                        {quiz.title}
                      </h4>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-xs text-slate-400">📝 {quiz.settings?.questionCount}문제</span>
                        <span className="text-xs text-slate-400">⏱ {quiz.settings?.timerSeconds}초</span>
                        <span className={`text-xs font-medium ${diffColor[quiz.settings?.difficulty ?? 'medium']}`}>
                          ● {diffLabel[quiz.settings?.difficulty ?? 'medium']}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="font-mono text-xs text-slate-500 bg-slate-900 px-2 py-1 rounded-lg">
                        {quiz.accessCode}
                      </span>
                      <span className="text-indigo-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                        시작하기 →
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
