/**
 * 공통 UI 조각 (v2 디자인 리프레시).
 *
 * 변경점:
 *   - 카드에 유리질감(반투명 + blur + 은은한 그림자)을 적용해 더 고급스러운 톤으로.
 *   - SectionTitle에서 소제목(hint) 표시를 없앴다. 제목 하나로 화면의 목적을
 *     전달하고, 필요한 설명은 본문 흐름 안에 자연스럽게 녹인다.
 *   - 버튼에 그라디언트와 은은한 글로우를 추가해 눌렀을 때의 손맛을 살렸다.
 */

import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router-dom'

// ---------------------------------------------------------------------------
// 카드 / 섹션
// ---------------------------------------------------------------------------

export function Card({
  children,
  className = '',
  tone = 'default',
  style,
}: {
  children: ReactNode
  className?: string
  tone?: 'default' | 'accent' | 'warn' | 'danger'
  /** 유형별 강조색처럼 동적인 값에만 예외적으로 사용한다 (기본은 className으로) */
  style?: CSSProperties
}) {
  const toneClass = {
    default: 'border-lab-border',
    accent: 'border-lab-accent/40',
    warn: 'border-lab-warn/40',
    danger: 'border-lab-danger/40',
  }[tone]
  return (
    <div
      style={style}
      className={`rounded-3xl border bg-lab-surface p-5 shadow-[var(--shadow-card)] sm:p-6 ${toneClass} ${className}`}
    >
      {children}
    </div>
  )
}

/**
 * 페이지 제목. 소제목(hint)을 두지 않는다 — 화면당 하나의 명확한 제목만 보여주고,
 * 부연 설명이 필요하면 본문 문단이나 카드 안의 짧은 문장으로 자연스럽게 배치한다.
 */
export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-4 text-xl font-bold tracking-tight text-lab-text sm:text-2xl">{children}</h2>
  )
}

/** 본문 흐름에 쓰는 짧은 설명 문단 — SectionTitle과 분리된 독립 요소로만 쓴다 */
export function Lead({ children }: { children: ReactNode }) {
  return <p className="mb-5 text-sm leading-relaxed text-lab-muted sm:text-base">{children}</p>
}

// ---------------------------------------------------------------------------
// 버튼
// ---------------------------------------------------------------------------

interface ButtonProps {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'md' | 'lg'
  full?: boolean
  type?: 'button' | 'submit'
  title?: string
}

const BUTTON_VARIANTS = {
  primary:
    'bg-gradient-to-br from-lab-accent to-lab-accent-2 text-white shadow-[var(--shadow-glow-accent)] hover:brightness-110 hover:-translate-y-0.5 hover:shadow-[0_1px_2px_rgba(58,47,36,0.06),0_16px_30px_-12px_rgba(238,125,83,0.5)] disabled:from-lab-border disabled:to-lab-border disabled:text-lab-muted disabled:shadow-none disabled:hover:translate-y-0',
  secondary:
    'border border-lab-border-strong bg-lab-surface-2 text-lab-text hover:border-lab-accent/50 hover:bg-lab-surface disabled:opacity-40 disabled:hover:border-lab-border-strong',
  ghost: 'text-lab-muted hover:text-lab-text disabled:opacity-40',
  danger:
    'border border-lab-danger/50 bg-lab-danger/10 text-lab-danger hover:bg-lab-danger/20 disabled:opacity-40',
} as const

export function Button({
  children,
  onClick,
  disabled,
  variant = 'primary',
  size = 'md',
  full,
  type = 'button',
  title,
}: ButtonProps) {
  const sizeClass = size === 'lg' ? 'min-h-14 px-7 text-lg' : 'min-h-11 px-5 text-sm'
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl font-bold whitespace-nowrap transition-all duration-200 ease-out active:scale-[0.98] active:duration-75 disabled:cursor-not-allowed ${sizeClass} ${BUTTON_VARIANTS[variant]} ${full ? 'w-full sm:flex-1' : 'sm:shrink-0'}`}
    >
      {children}
    </button>
  )
}

export function LinkButton({
  to,
  children,
  variant = 'primary',
  size = 'md',
  full,
  disabled,
}: {
  to: string
  children: ReactNode
  variant?: keyof typeof BUTTON_VARIANTS
  size?: 'md' | 'lg'
  full?: boolean
  disabled?: boolean
}) {
  const sizeClass = size === 'lg' ? 'min-h-14 px-7 text-lg' : 'min-h-11 px-5 text-sm'
  if (disabled) {
    return (
      <span
        aria-disabled
        className={`inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-2xl bg-lab-border font-bold whitespace-nowrap text-lab-muted ${sizeClass} ${full ? 'w-full sm:flex-1' : 'sm:shrink-0'}`}
      >
        {children}
      </span>
    )
  }
  return (
    <Link
      to={to}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl font-bold whitespace-nowrap transition-all duration-200 ease-out active:scale-[0.98] active:duration-75 ${sizeClass} ${BUTTON_VARIANTS[variant]} ${full ? 'w-full sm:flex-1' : 'sm:shrink-0'}`}
    >
      {children}
    </Link>
  )
}

// ---------------------------------------------------------------------------
// 진행률
// ---------------------------------------------------------------------------

export const FLOW_STEPS = [
  { path: '/needs', label: '욕구 입력' },
  { path: '/type', label: '유형 확인' },
  { path: '/ratings', label: '대안 평가' },
  { path: '/svd', label: 'SVD 분석' },
  { path: '/map', label: '잠재공간 지도' },
  { path: '/cluster', label: '군집 판정' },
  { path: '/result', label: '결과' },
] as const

export function ProgressBar({ stepIndex, subLabel }: { stepIndex: number; subLabel?: string }) {
  const total = FLOW_STEPS.length
  const current = FLOW_STEPS[stepIndex]
  const percent = ((stepIndex + 1) / total) * 100
  return (
    <div className="mb-6">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="font-mono text-xs tracking-[0.2em] text-lab-accent">
          {stepIndex + 1} / {total}
        </span>
        <span className="text-sm font-semibold text-lab-text">
          {current.label}
          {subLabel ? <span className="ml-1.5 font-normal text-lab-muted">· {subLabel}</span> : null}
        </span>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-lab-surface-2"
        role="progressbar"
        aria-valuenow={stepIndex + 1}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={`전체 ${total}단계 중 ${stepIndex + 1}단계: ${current.label}`}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-lab-accent to-lab-accent-2 transition-[width] duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// 알림
// ---------------------------------------------------------------------------

export function Notice({
  tone = 'info',
  title,
  children,
}: {
  tone?: 'info' | 'warn' | 'danger' | 'success'
  title?: string
  children: ReactNode
}) {
  const styles = {
    info: 'border-lab-accent/30 bg-lab-accent/[0.06] text-lab-text',
    warn: 'border-lab-warn/40 bg-lab-warn/[0.08] text-lab-text',
    danger: 'border-lab-danger/40 bg-lab-danger/[0.08] text-lab-text',
    success: 'border-lab-positive/40 bg-lab-positive/[0.08] text-lab-text',
  }[tone]
  const icon = { info: 'ℹ️', warn: '⚠️', danger: '⛔', success: '✅' }[tone]
  return (
    <div className={`rounded-2xl border p-4 text-sm leading-relaxed ${styles}`}>
      <div className="flex gap-3">
        <span aria-hidden className="shrink-0">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          {title ? <p className="mb-1 font-bold">{title}</p> : null}
          <div className="whitespace-pre-line text-lab-muted">{children}</div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// 수식 접기/펼치기
// ---------------------------------------------------------------------------

export function FormulaDetails({ summary, children }: { summary: string; children: ReactNode }) {
  return (
    <details className="group mt-4 rounded-2xl border border-lab-border bg-lab-surface-2">
      <summary className="cursor-pointer list-none rounded-2xl px-4 py-3 text-sm font-semibold text-lab-accent transition-colors duration-150 hover:bg-lab-surface/60">
        <span aria-hidden className="mr-2 inline-block transition-transform duration-200 group-open:rotate-90">
          ▶
        </span>
        {summary}
      </summary>
      <div className="border-t border-lab-border px-4 py-4 font-mono text-xs leading-loose text-lab-muted sm:text-sm">
        {children}
      </div>
    </details>
  )
}

// ---------------------------------------------------------------------------
// 군집 색상/도형
// ---------------------------------------------------------------------------

export const CLUSTER_COLORS = [
  'var(--color-cluster-1)',
  'var(--color-cluster-2)',
  'var(--color-cluster-3)',
  'var(--color-cluster-4)',
  'var(--color-cluster-5)',
  'var(--color-cluster-6)',
  'var(--color-cluster-7)',
  'var(--color-cluster-8)',
]

export const CLUSTER_SHAPES = ['circle', 'square', 'triangle', 'diamond', 'star', 'cross'] as const

export function clusterColor(index: number): string {
  return CLUSTER_COLORS[index % CLUSTER_COLORS.length]
}

export function clusterShape(index: number): (typeof CLUSTER_SHAPES)[number] {
  return CLUSTER_SHAPES[index % CLUSTER_SHAPES.length]
}

export function ClusterBadge({
  index,
  name,
  size = 'md',
}: {
  index: number
  name: string
  size?: 'sm' | 'md'
}) {
  const color = clusterColor(index)
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-xl border font-bold ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1.5 text-sm'}`}
      style={{ borderColor: `${color}80`, backgroundColor: `${color}1a`, color }}
    >
      <span
        aria-hidden
        className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px]"
        style={{ backgroundColor: color, color: 'var(--color-lab-bg)' }}
      >
        {index + 1}
      </span>
      {name}
    </span>
  )
}

// ---------------------------------------------------------------------------
// 데이터 표
// ---------------------------------------------------------------------------

export function DataTable({
  headers,
  rows,
  align,
}: {
  headers: string[]
  rows: ReactNode[][]
  align?: ('left' | 'right' | 'center')[]
}) {
  const alignClass = (i: number) => {
    const value = align?.[i] ?? (i === 0 ? 'left' : 'right')
    return value === 'left' ? 'text-left' : value === 'center' ? 'text-center' : 'text-right'
  }
  return (
    <div className="-mx-1 overflow-x-auto">
      <table className="w-full min-w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-lab-border">
            {headers.map((header, i) => (
              <th
                key={header}
                className={`px-2 py-2 text-xs font-semibold whitespace-nowrap text-lab-muted ${alignClass(i)}`}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r} className="border-b border-lab-border/50 last:border-0">
              {row.map((cell, c) => (
                <td key={c} className={`px-2 py-2 whitespace-nowrap ${alignClass(c)}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function ShareBar({ share, color }: { share: number; color?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-20 shrink-0 overflow-hidden rounded-full bg-lab-surface-2 sm:w-28">
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.min(100, share * 100)}%`,
            backgroundColor: color ?? 'var(--color-lab-accent)',
          }}
        />
      </div>
      <span className="font-mono text-xs tabular-nums text-lab-text">
        {(share * 100).toFixed(0)}%
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// 1~10 점수 버튼 — 감성욕구/대안평가 화면에서 공통으로 쓴다
// ---------------------------------------------------------------------------

export function ScoreButtons({
  value,
  onChange,
  min = 1,
  max = 10,
  label,
  activeClassName = 'border-transparent bg-lab-accent text-white scale-105 shadow-[var(--shadow-glow-accent)]',
}: {
  value: number | null
  onChange: (v: number) => void
  min?: number
  max?: number
  label: string
  activeClassName?: string
}) {
  const scores = Array.from({ length: max - min + 1 }, (_, i) => min + i)
  return (
    <div role="radiogroup" aria-label={label} className="grid grid-cols-10 gap-1 sm:gap-1.5">
      {scores.map((score) => {
        const selected = value === score
        return (
          <button
            key={score}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`${label} ${score}점`}
            onClick={() => onChange(score)}
            className={`flex min-h-11 items-center justify-center rounded-lg border font-mono text-sm font-bold transition-all duration-150 ease-out active:scale-95 ${
              selected
                ? activeClassName
                : 'border-lab-border bg-lab-surface-2 text-lab-muted hover:scale-105 hover:border-lab-accent/50 hover:text-lab-text'
            }`}
          >
            {score}
          </button>
        )
      })}
    </div>
  )
}
