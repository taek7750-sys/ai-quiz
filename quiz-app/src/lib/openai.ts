import OpenAI from 'openai'
import type { Question, GenerateSettings } from '../types'

export type { Question, GenerateSettings }

const client = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // MVP only — move to Cloud Functions in production
})

const difficultyMap = { easy: '쉬움', medium: '보통', hard: '어려움' }
const typeMap = { multiple: '객관식 4지선다', short: '단답형', mixed: '혼합' }

export async function generateQuestions(
  content: string,
  settings: GenerateSettings,
  onProgress?: (msg: string) => void
): Promise<Question[]> {
  onProgress?.('OpenAI에 문제 생성 요청 중...')

  const prompt = `당신은 기업 교육용 퀴즈 문제를 생성하는 전문가입니다.

[입력 내용]
${content}

[요구사항]
- 문제 수: ${settings.questionCount}개
- 난이도: ${difficultyMap[settings.difficulty]}
- 유형: ${typeMap[settings.questionType]} (multiple=객관식 4지선다, short=단답형, mixed=혼합)
- 언어: 한국어

[출력 형식] JSON 배열만 출력하세요. 마크다운 코드블록 없이, 순수 JSON만.
[
  {
    "order": 1,
    "type": "multiple",
    "question": "문제 내용",
    "options": ["보기1", "보기2", "보기3", "보기4"],
    "answer": "정답 (options 중 하나와 동일한 텍스트)",
    "explanation": "해설 (2-3문장)"
  }
]

[주의사항]
- 정답이 항상 특정 위치에 오지 않도록 무작위 배치
- 오답 보기는 그럴듯하게 작성
- 해설은 왜 정답인지 포함
- short 타입은 options를 빈 배열([])로`

  const response = await client.chat.completions.create({
    model: 'gpt-5.5',
    messages: [{ role: 'user', content: prompt }],
    max_completion_tokens: 4000,
  })

  const text = response.choices[0].message.content ?? '[]'
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

  try {
    const questions: Question[] = JSON.parse(cleaned)
    return questions
  } catch {
    throw new Error('AI 응답 파싱 실패: ' + text.slice(0, 200))
  }
}
