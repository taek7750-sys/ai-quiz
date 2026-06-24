import { create } from 'zustand'
import type { Question } from '../types'

export interface QuizSet {
  id: string
  title: string
  description: string
  status: 'draft' | 'active' | 'closed'
  accessCode: string
  settings: {
    questionCount: number
    difficulty: 'easy' | 'medium' | 'hard'
    questionType: 'multiple' | 'short' | 'mixed'
    timerSeconds: number
    retryLimit: number | null
  }
  createdAt: number
  questions?: Question[]
}

export interface Submission {
  id?: string
  nickname: string
  department: string
  score: number
  totalQuestions: number
  totalTimeMs: number
  submittedAt: number
  answers: Array<{
    questionId: string
    selectedAnswer: string
    isCorrect: boolean
    timeSpentMs: number
    correctAnswer: string
    explanation: string
  }>
}

export interface LeaderboardEntry {
  rank: number
  nickname: string
  department: string
  score: number
  totalTimeMs: number
  submittedAt: number
}

interface AppState {
  isAdmin: boolean
  nickname: string
  department: string
  currentSetId: string | null
  draftQuestions: Question[]
  lastSubmission: Submission | null

  setIsAdmin: (v: boolean) => void
  setNickname: (n: string) => void
  setDepartment: (d: string) => void
  setCurrentSetId: (id: string | null) => void
  setDraftQuestions: (q: Question[]) => void
  setLastSubmission: (s: Submission | null) => void
}

export const useStore = create<AppState>((set) => ({
  isAdmin: sessionStorage.getItem('isAdmin') === 'true',
  nickname: sessionStorage.getItem('nickname') ?? '',
  department: sessionStorage.getItem('department') ?? '',
  currentSetId: null,
  draftQuestions: [],
  lastSubmission: null,

  setIsAdmin: (v) => {
    sessionStorage.setItem('isAdmin', String(v))
    set({ isAdmin: v })
  },
  setNickname: (n) => {
    sessionStorage.setItem('nickname', n)
    set({ nickname: n })
  },
  setDepartment: (d) => {
    sessionStorage.setItem('department', d)
    set({ department: d })
  },
  setCurrentSetId: (id) => set({ currentSetId: id }),
  setDraftQuestions: (q) => set({ draftQuestions: q }),
  setLastSubmission: (s) => set({ lastSubmission: s }),
}))
