import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useStore } from '../store/useStore'

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const sec = s % 60
  return m > 0 ? `${m}분 ${sec}초` : `${sec}초`
}

export function Results() {
  const { setId } = useParams<{ setId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { lastSubmission, nickname } = useStore()
  const rank = searchParams.get('rank')

  if (!lastSubmission) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-slate-400 mb-4">결과 데이터가 없습니다.</p>
          <button onClick={() => navigate('/')} className="text-indigo-400 hover:text-indigo-300">
            홈으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  const { score, totalQuestions, totalTimeMs, answers } = lastSubmission
  const percentage = Math.round((score / totalQuestions) * 100)

  const emoji = percentage >= 90 ? '🏆' : percentage >= 70 ? '🎉' : percentage >= 50 ? '👍' : '💪'
  const message = percentage >= 90 ? '완벽합니다!' : percentage >= 70 ? '잘 하셨네요!' : percentage >= 50 ? '절반 이상 맞혔어요!' : '다음엔 더 잘할 수 있어요!'

  return (
    <div className="min-h-screen px-4 py-6 max-w-2xl mx-auto">
      <div className="text-center mb-8 slide-up">
        <div className="text-6xl mb-3">{emoji}</div>
        <h1 className="text-3xl font-bold text-white mb-1">{message}</h1>
        <p className="text-slate-400">{nickname}님의 결과</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 text-center">
          <div className="text-3xl font-bold text-indigo-400">{score}/{totalQuestions}</div>
          <div className="text-xs text-slate-400 mt-1">정답 수</div>
        </div>
        <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 text-center">
          <div className="text-3xl font-bold text-lime-400">{percentage}%</div>
          <div className="text-xs text-slate-400 mt-1">정답률</div>
        </div>
        <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 text-center">
          <div className="text-3xl font-bold text-amber-400">#{rank ?? '-'}</div>
          <div className="text-xs text-slate-400 mt-1">순위</div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 mb-6">
        <div className="flex justify-between text-sm text-slate-400">
          <span>총 소요 시간</span>
          <span className="text-white font-medium">{formatTime(totalTimeMs)}</span>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-white mb-3">문제별 결과</h2>
      <div className="space-y-3 mb-8">
        {answers.map((a, idx) => (
          <div
            key={idx}
            className={`rounded-2xl p-4 border ${
              a.isCorrect
                ? 'bg-green-900/20 border-green-800'
                : 'bg-red-900/20 border-red-800'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className={`mt-0.5 shrink-0 text-lg ${a.isCorrect ? '✅' : '❌'}`}>
                {a.isCorrect ? '✅' : '❌'}
              </span>
              <div className="flex-1">
                <div className="text-white text-sm font-medium mb-1">Q{idx + 1}</div>
                {!a.isCorrect && (
                  <div className="text-red-400 text-xs mb-1">내 답: {a.selectedAnswer || '(미입력)'}</div>
                )}
                <div className={`text-xs mb-1 ${a.isCorrect ? 'text-green-400' : 'text-green-300'}`}>
                  정답: {a.correctAnswer}
                </div>
                <div className="text-slate-500 text-xs">{a.explanation}</div>
              </div>
              <div className="text-xs text-slate-500 shrink-0">{formatTime(a.timeSpentMs)}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => navigate(`/leaderboard/${setId}`)}
          className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
        >
          🏅 리더보드
        </button>
        <button
          onClick={() => navigate('/')}
          className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold transition-colors"
        >
          홈으로
        </button>
      </div>
    </div>
  )
}
