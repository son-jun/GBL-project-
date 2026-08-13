/**
 * 관리자 탭 2 — 참가자 데이터 조회 및 CSV 내보내기 (v2).
 *
 * 요구사항 §18: 개인을 특정할 수 있는 정보는 애초에 저장되지 않으므로 이 표에도 없다.
 */

import { useCallback, useEffect, useState } from 'react'
import { Button, Card, DataTable, Notice, clusterColor } from '@/components/ui'
import { CONSUMPTION_ALTERNATIVES } from '@/config/alternatives'
import { NEED_AXES } from '@/config/needs'
import { downloadCsv, toCsv } from '@/lib/data/csv'
import { participantRepository } from '@/lib/storage'
import { formatDistance } from '@/lib/util/format'
import { formatDateTime } from '@/lib/util/participantId'
import type { ParticipantRecord } from '@/lib/types'

export function AdminParticipantsTab() {
  const [records, setRecords] = useState<ParticipantRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState<string | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setRecords(await participantRepository.listAll())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  /**
   * 참가자 데이터를 CSV로 내보낸다.
   * 재현성을 위해 입력 원자료(q, A 전체), 사용된 분석 규격 버전, 결과 좌표,
   * 배정 군집, 세부 잠재수요를 모두 포함한다.
   */
  const exportCsv = () => {
    if (records.length === 0) return

    const needHeaders = NEED_AXES.map((n) => `need_${n.key}`)
    const ratingHeaders = CONSUMPTION_ALTERNATIVES.flatMap((alt) =>
      NEED_AXES.map((n) => `rating_${alt.key}_${n.key}`),
    )
    const latentDim = Math.max(...records.map((r) => r.result.needProjected.length), 0)
    const zHeaders = Array.from({ length: latentDim }, (_, k) => `q_star_${k + 1}`)

    const headers = [
      'participant_id',
      'created_at',
      'feelconomy_type_code',
      ...needHeaders,
      ...ratingHeaders,
      ...zHeaders,
      'assigned_cluster',
      'assigned_cluster_name',
      'nearest_alternative_in_cluster',
      'nearest_alternative_overall',
      'margin_to_second_cluster',
      'spec_version',
      ...zHeaders.map((h) => `hand_${h}`),
      'hand_max_abs_delta',
    ]

    const rows = records.map((record) => [
      record.participantId,
      record.createdAt,
      record.feelconomyTypeCode,
      ...record.input.currentNeeds,
      ...record.input.alternativeRatings.flat(),
      ...Array.from({ length: latentDim }, (_, k) => record.result.needProjected[k]?.toFixed(6) ?? ''),
      record.result.assignedCluster + 1,
      record.result.clusters[record.result.assignedCluster]?.name ?? '',
      CONSUMPTION_ALTERNATIVES[record.result.nearestAlternativeInCluster]?.label ?? '',
      CONSUMPTION_ALTERNATIVES[record.result.nearestAlternativeOverall]?.label ?? '',
      Number.isFinite(record.result.marginToSecondCluster)
        ? record.result.marginToSecondCluster.toFixed(6)
        : '',
      record.result.specVersion,
      ...Array.from(
        { length: latentDim },
        (_, k) => record.handCalculation?.reported[k]?.toFixed(4) ?? '',
      ),
      record.handCalculation?.maxAbsDelta.toFixed(4) ?? '',
    ])

    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '')
    downloadCsv(`feelconomy_participants_${stamp}.csv`, toCsv(headers, rows))
    setNotice(`${records.length}행을 CSV로 내보냈습니다.`)
  }

  const clearAll = async () => {
    await participantRepository.clear()
    await refresh()
    setConfirmClear(false)
    setNotice('참가자 데이터를 모두 삭제했습니다.')
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-lab-text">
              참가자 데이터{' '}
              <span className="ml-1 font-mono text-lab-accent">{records.length}건</span>
            </p>
            <p className="mt-0.5 text-xs text-lab-muted">
              이름·전화번호·이메일·학번은 수집하지 않으므로 이 표에도 없습니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => void refresh()} disabled={loading}>
              🔄 새로고침
            </Button>
            <Button onClick={exportCsv} disabled={records.length === 0}>
              ⬇ CSV 내보내기
            </Button>
            {records.length > 0 ? (
              <Button variant="danger" onClick={() => setConfirmClear(true)}>
                전체 삭제
              </Button>
            ) : null}
          </div>
        </div>
      </Card>

      {confirmClear ? (
        <Card tone="danger">
          <p className="mb-3 text-sm font-bold text-lab-danger">
            참가자 데이터 {records.length}건을 모두 삭제합니다. 되돌릴 수 없습니다.
          </p>
          <p className="mb-3 text-xs text-lab-muted">먼저 CSV로 내보냈는지 확인해 주세요.</p>
          <div className="flex gap-2">
            <Button variant="danger" onClick={() => void clearAll()}>
              삭제 확인
            </Button>
            <Button variant="ghost" onClick={() => setConfirmClear(false)}>
              취소
            </Button>
          </div>
        </Card>
      ) : null}

      {notice ? (
        <div onClick={() => setNotice(null)} className="cursor-pointer">
          <Notice tone="success">{notice}</Notice>
        </div>
      ) : null}

      {loading ? (
        <Notice tone="info">불러오는 중…</Notice>
      ) : records.length === 0 ? (
        <Notice tone="info">
          아직 저장된 참가자 데이터가 없습니다. 참가자 화면에서 분석을 한 번 진행하면 여기에
          나타납니다.
        </Notice>
      ) : (
        <Card>
          <p className="mb-3 text-sm font-bold text-lab-text">전체 기록 (최신순)</p>
          <DataTable
            headers={[
              '익명 ID',
              '입력시각',
              '유형',
              '배정 군집',
              '세부 잠재수요',
              '1-2위 거리차',
              '규격 버전',
              '손계산 오차',
            ]}
            align={['left', 'left', 'left', 'left', 'left', 'right', 'left', 'right']}
            rows={records.map((record) => {
              const cluster = record.result.clusters[record.result.assignedCluster]
              return [
                <span key="id" className="font-mono text-xs font-bold text-lab-accent">
                  {record.participantId}
                </span>,
                <span key="t" className="font-mono text-[11px] text-lab-muted">
                  {formatDateTime(record.createdAt)}
                </span>,
                <span key="ty" className="font-mono text-xs font-bold text-lab-text">
                  {record.feelconomyTypeCode}
                </span>,
                <span key="c" className="flex items-center gap-1.5 text-xs">
                  <span
                    aria-hidden
                    className="flex h-4 w-4 items-center justify-center rounded-full font-mono text-[9px] font-bold"
                    style={{
                      backgroundColor: clusterColor(record.result.assignedCluster),
                      color: 'var(--color-lab-bg)',
                    }}
                  >
                    {record.result.assignedCluster + 1}
                  </span>
                  <span className="text-lab-muted">{cluster?.name ?? '—'}</span>
                </span>,
                <span key="n" className="text-xs text-lab-text">
                  {CONSUMPTION_ALTERNATIVES[record.result.nearestAlternativeInCluster]?.label ?? '—'}
                </span>,
                <span key="m" className="font-mono text-xs tabular-nums text-lab-muted">
                  {Number.isFinite(record.result.marginToSecondCluster)
                    ? formatDistance(record.result.marginToSecondCluster)
                    : '—'}
                </span>,
                <span key="v" className="font-mono text-[11px] text-lab-muted">
                  {record.result.specVersion}
                </span>,
                <span key="h" className="font-mono text-xs tabular-nums text-lab-muted">
                  {record.handCalculation ? record.handCalculation.maxAbsDelta.toFixed(2) : '—'}
                </span>,
              ]
            })}
          />

          {new Set(records.map((r) => r.result.specVersion)).size > 1 ? (
            <div className="mt-4">
              <Notice tone="warn" title="여러 분석 규격 버전의 데이터가 섞여 있습니다">
                {`발견된 버전: ${[...new Set(records.map((r) => r.result.specVersion))].join(', ')}\n` +
                  '분석할 때 spec_version으로 나눠서 살펴보는 것을 권장합니다.'}
              </Notice>
            </div>
          ) : null}
        </Card>
      )}
    </div>
  )
}
