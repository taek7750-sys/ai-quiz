export interface Question {
  id?: string
  order: number
  type: 'multiple' | 'short'
  question: string
  options: string[]
  answer: string
  explanation: string
}

export interface GenerateSettings {
  questionCount: number
  difficulty: 'easy' | 'medium' | 'hard'
  questionType: 'multiple' | 'short' | 'mixed'
}
