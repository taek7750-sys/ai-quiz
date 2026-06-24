import { useNavigate } from 'react-router-dom'

export function Home() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md slide-up">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-indigo-600 mb-6">
            <span className="text-4xl">🧠</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">AI 퀴즈</h1>
          <p className="text-slate-400 text-lg">AI가 만드는 스마트한 학습 퀴즈</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => navigate('/quiz')}
            className="w-full py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-lg transition-all duration-200 flex items-center justify-between group"
          >
            <span className="flex items-center gap-3">
              <span className="text-2xl">🎯</span>
              <span>퀴즈 참여하기</span>
            </span>
            <span className="text-slate-300 group-hover:translate-x-1 transition-transform">→</span>
          </button>

          <button
            onClick={() => navigate('/admin/login')}
            className="w-full py-4 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-lg transition-all duration-200 flex items-center justify-between group"
          >
            <span className="flex items-center gap-3">
              <span className="text-2xl">⚙️</span>
              <span>관리자 로그인</span>
            </span>
            <span className="text-slate-500 group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </div>

        <p className="text-center text-slate-600 text-sm mt-8">
          AI 퀴즈 프로그램 · 교육담당자용 관리 시스템
        </p>
      </div>
    </div>
  )
}
