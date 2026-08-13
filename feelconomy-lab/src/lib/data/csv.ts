/**
 * CSV 읽기/쓰기 유틸 — 요구사항 §16 (CSV 업로드), §16 (CSV 다운로드).
 *
 * 외부 CSV 라이브러리를 쓰지 않은 이유: 우리가 다루는 CSV는 스키마가 고정되어 있고,
 * 인용부호가 포함된 필드까지만 처리하면 충분하다. 의존성을 줄이면 오프라인 부스 환경에서
 * 설치 실패 위험도 줄어든다.
 */

/** 한 줄을 CSV 규칙(따옴표 escape 포함)에 따라 필드 배열로 나눈다 */
export function parseCsvLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (inQuotes) {
      if (char === '"') {
        // "" 는 필드 안의 문자 " 를 뜻한다
        if (line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += char
      }
    } else if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      fields.push(current)
      current = ''
    } else {
      current += char
    }
  }
  fields.push(current)
  return fields
}

export interface ParsedCsv {
  headers: string[]
  rows: Record<string, string>[]
}

/**
 * CSV 텍스트를 헤더 기반 객체 배열로 파싱한다.
 * - UTF-8 BOM 제거 (엑셀에서 저장한 파일에 자주 붙는다)
 * - CRLF / LF 모두 처리
 * - 완전히 빈 줄은 건너뛴다
 */
export function parseCsv(text: string): ParsedCsv {
  const cleaned = text.replace(/^﻿/, '')
  const lines = cleaned.split(/\r\n|\n|\r/).filter((line) => line.trim().length > 0)
  if (lines.length === 0) return { headers: [], rows: [] }

  const headers = parseCsvLine(lines[0]).map((h) => h.trim())
  const rows = lines.slice(1).map((line) => {
    const fields = parseCsvLine(line)
    const row: Record<string, string> = {}
    headers.forEach((header, i) => {
      row[header] = (fields[i] ?? '').trim()
    })
    return row
  })
  return { headers, rows }
}

/** 필드 하나를 CSV 규칙에 맞게 감싼다 (쉼표·따옴표·줄바꿈이 있으면 인용부호로) */
export function escapeCsvField(value: unknown): string {
  const s = value === null || value === undefined ? '' : String(value)
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** 헤더 + 행 배열을 CSV 텍스트로 만든다. 엑셀 호환을 위해 BOM을 붙인다. */
export function toCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const lines = [headers.map(escapeCsvField).join(',')]
  for (const row of rows) lines.push(row.map(escapeCsvField).join(','))
  // ﻿: 엑셀이 UTF-8 한글을 깨뜨리지 않도록 하는 BOM
  return '﻿' + lines.join('\r\n') + '\r\n'
}

/** 브라우저에서 CSV 파일을 즉시 내려받게 한다 */
export function downloadCsv(filename: string, csvText: string): void {
  const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

/** JSON 파일 내려받기 (모델 백업용) */
export function downloadJson(filename: string, value: unknown): void {
  const blob = new Blob([JSON.stringify(value, null, 2)], {
    type: 'application/json;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

/**
 * 여러 값이 들어 있는 셀을 배열로 나눈다.
 * 기준 데이터셋 CSV에서 소비 카테고리를 "travel|culture" 처럼 파이프로 구분해 담는다.
 * 파이프 외에 세미콜론과 쉼표도 허용해 손으로 만든 파일도 받아들인다.
 */
export const MULTI_VALUE_SEPARATOR = '|'

export function splitMultiValue(cell: string): string[] {
  if (!cell) return []
  return cell
    .split(/[|;,]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

export function joinMultiValue(values: string[]): string {
  return values.join(MULTI_VALUE_SEPARATOR)
}
