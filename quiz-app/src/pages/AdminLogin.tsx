import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'

export function AdminLogin() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const setIsAdmin = useStore((s) => s.setIsAdmin)

  const handleLogin = () => {
    const adminPw = import.meta.env.VITE_ADMIN_PASSWORD
    if (password === adminPw) {
      setIsAdmin(true)
      navigate('/admin')
    } else {
      setError('비밀번호가 올바르지 않습니다.')
      setPassword('')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-800 mb-4">
            <span className="text-3xl">🔐</span>
          </div>
          <h2 className="text-2xl font-bold text-white">관리자 인증</h2>
          <p className="text-slate-400 mt-1">교육담당자 전용 화면입니다</p>
        </div>

        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          <div className="mb-4">
            <label className="block text-slate-300 text-sm font-medium mb-2">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError('') }}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="관리자 비밀번호 입력"
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              autoFocus
            />
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-900/30 border border-red-800 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
          >
            로그인
          </button>
        </div>

        <button
          onClick={() => navigate('/')}
          className="w-full mt-4 text-slate-500 hover:text-slate-300 text-sm transition-colors"
        >
          ← 홈으로 돌아가기
        </button>
      </div>
    </div>
  )
}
