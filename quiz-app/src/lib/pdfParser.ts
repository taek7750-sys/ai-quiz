import * as pdfjsLib from 'pdfjs-dist'

// Vite에서 PDF.js worker 경로 설정
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

export async function extractTextFromPdf(
  file: File,
  onProgress?: (msg: string) => void
): Promise<string> {
  onProgress?.('PDF 파일 읽는 중...')

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  onProgress?.(`PDF 파싱 중... (${pdf.numPages}페이지)`)

  const textParts: string[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    onProgress?.(`페이지 추출 중 ${i}/${pdf.numPages}...`)
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
    if (pageText.trim()) {
      textParts.push(`[페이지 ${i}]\n${pageText}`)
    }
  }

  const fullText = textParts.join('\n\n')

  if (!fullText.trim()) {
    throw new Error('PDF에서 텍스트를 추출할 수 없습니다. 이미지 기반 스캔 PDF는 지원하지 않습니다.')
  }

  // 8000 토큰 제한 (약 24,000자)을 위해 앞부분 사용
  const maxChars = 24000
  if (fullText.length > maxChars) {
    onProgress?.(`텍스트가 길어 앞부분 ${maxChars}자만 사용합니다.`)
    return fullText.slice(0, maxChars)
  }

  return fullText
}
