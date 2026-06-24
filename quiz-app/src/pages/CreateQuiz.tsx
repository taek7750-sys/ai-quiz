import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, doc, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { generateQuestions } from '../lib/openai'
import { extractTextFromPdf } from '../lib/pdfParser'
import { useStore } from '../store/useStore'

function randomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export function CreateQuiz() {
  const navigate = useNavigate()
  const setDraftQuestions = useStore((s) => s.setDraftQuestions)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState('')
  const [inputType, setInputType] = useState<'topic' | 'text' | 'pdf'>('topic')
  const [content, setContent] = useState('')
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [questionCount, setQuestionCount] = useState(10)
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [questionType, setQuestionType] = useState<'multiple' | 'short' | 'mixed'>('multiple')
  const [timerSeconds, setTimerSeconds] = useState(30)
  const [retryLimit, setRetryLimit] = useState<number | null>(null)

  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')

  const handlePdfSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      setError('PDF 파일만 업로드 가능합니다.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('파일 크기는 10MB 이하여야 합니다.')
      return
    }
    setPdfFile(file)
    setError('')
  }

  const handleGenerate = async () => {
    if (!title.trim()) { setError('퀴즈 제목을 입력해주세요.'); return }
    if (inputType !== 'pdf' && !content.trim()) { setError('내용을 입력해주세요.'); return }
    if (inputType === 'pdf' && !pdfFile) { setError('PDF 파일을 업로드해주세요.'); return }

    setLoading(true)
    setError('')
    setProgress('문제 생성 시작...')

    try {
      let finalContent = content

      if (inputType === 'pdf') {
        finalContent = await extractTextFromPdf(pdfFile!, setProgress)
      } else if (inputType === 'topic') {
        finalContent = `주제: ${content}`
      }

      const questions = await generateQuestions(
        finalContent,
        { questionCount, difficulty, questionType },
        setProgress
      )

      setProgress('Firestore에 저장 중...')
      const accessCode = randomCode()
      const setRef = await addDoc(collection(db, 'quizSets'), {
        title: title.trim(),
        description: '',
        status: 'active',
        accessCode,
        settings: { questionCount, difficulty, questionType, timerSeconds, retryLimit },
        createdAt: Date.now(),
      })

      for (const q of questions) {
        await setDoc(doc(collection(db, 'quizSets', setRef.id, 'questions')), {
          ...q,
          createdAt: Date.now(),
        })
      }

      setDraftQuestions(questions.map((q, i) => ({ ...q, id: `q${i}` })))
      navigate(`/admin/review/${setRef.id}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '문제 생성 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
      setProgress('')
    }
  }

  const inputTabs = [
    { id: 'topic' as const, icon: '📌', label: '주제 입력' },
    { id: 'text' as const, icon: '📄', label: '텍스트' },
    { id: 'pdf' as const, icon: '📋', label: 'PDF 업로드' },
  ]

  return (
    <div className="min-h-screen px-4 py-6 max-w-2xl mx-auto">
      <button onClick={() => navigate('/admin')} className="text-slate-400 hover:text-white text-sm mb-6 flex items-center gap-1">
        ← 대시보드
      </button>

      <h1 className="text-2xl font-bold text-white mb-6">새 퀴즈 세트 생성</h1>

      <div className="space-y-5">
        {/* 제목 */}
        <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
          <label className="block text-slate-300 text-sm font-medium mb-2">퀴즈 제목 *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 개인정보보호법 기초"
            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* 입력 방식 */}
        <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
          <label className="block text-slate-300 text-sm font-medium mb-3">입력 방식</label>
          <div className="flex gap-2 mb-4">
            {inputTabs.map((t) => (
              <button
                key={t.id}
                onClick={() => { setInputType(t.id); setError('') }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
                  inputType === t.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {inputType === 'topic' && (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="예: 화재 안전 및 소화기 사용법"
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
            />
          )}

          {inputType === 'text' && (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="학습 자료 텍스트를 붙여넣기 하세요..."
              rows={8}
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
            />
          )}

          {inputType === 'pdf' && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handlePdfSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`w-full py-8 rounded-xl border-2 border-dashed transition-all text-center ${
                  pdfFile
                    ? 'border-indigo-500 bg-indigo-900/20'
                    : 'border-slate-600 hover:border-slate-400 bg-slate-900'
                }`}
              >
                {pdfFile ? (
                  <div>
                    <div className="text-3xl mb-2">✅</div>
                    <p className="text-indigo-300 font-medium text-sm">{pdfFile.name}</p>
                    <p className="text-slate-500 text-xs mt-1">
                      {(pdfFile.size / 1024 / 1024).toFixed(2)} MB · 클릭하여 변경
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="text-3xl mb-2">📋</div>
                    <p className="text-slate-300 font-medium text-sm">클릭하여 PDF 업로드</p>
                    <p className="text-slate-500 text-xs mt-1">최대 10MB · PDF 형식만 가능</p>
                  </div>
                )}
              </button>
              {pdfFile && (
                <button
                  onClick={() => { setPdfFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                  className="mt-2 text-slate-500 hover:text-red-400 text-xs transition-colors w-full text-center"
                >
                  × 파일 제거
                </button>
              )}
            </div>
          )}
        </div>

        {/* 문제 설정 */}
        <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
          <h3 className="text-slate-300 text-sm font-medium mb-4">문제 설정</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 text-xs mb-2">문제 수</label>
              <div className="flex gap-1">
                {[5, 10, 20].map((n) => (
                  <button
                    key={n}
                    onClick={() => setQuestionCount(n)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      questionCount === n ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    {n}개
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-slate-400 text-xs mb-2">난이도</label>
              <div className="flex gap-1">
                {([['easy', '쉬움'], ['medium', '보통'], ['hard', '어려움']] as const).map(([v, label]) => (
                  <button key={v} onClick={() => setDifficulty(v)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${difficulty === v ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
                  >{label}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-slate-400 text-xs mb-2">문제 유형</label>
              <div className="flex gap-1">
                {([['multiple', '객관식'], ['short', '단답형'], ['mixed', '혼합']] as const).map(([v, label]) => (
                  <button key={v} onClick={() => setQuestionType(v)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${questionType === v ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
                  >{label}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-slate-400 text-xs mb-2">문제당 타이머</label>
              <div className="flex gap-1 flex-wrap">
                {[15, 30, 60, 90].map((s) => (
                  <button key={s} onClick={() => setTimerSeconds(s)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${timerSeconds === s ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
                  >{s}초</button>
                ))}
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-slate-400 text-xs mb-2">재도전 허용</label>
              <div className="flex gap-1">
                {([[null, '무제한'], [1, '1회'], [3, '3회']] as const).map(([v, label]) => (
                  <button key={String(v)} onClick={() => setRetryLimit(v)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${retryLimit === v ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
                  >{label}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-900/30 border border-red-800 text-red-400 text-sm">
            {error}
          </div>
        )}

        {loading && (
          <div className="px-4 py-3 rounded-xl bg-indigo-900/30 border border-indigo-800 text-indigo-300 text-sm flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin shrink-0" />
            {progress}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold text-lg transition-colors"
        >
          {loading ? '생성 중...' : '✨ AI로 문제 생성하기'}
        </button>
      </div>
    </div>
  )
}
