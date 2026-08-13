/**
 * 라우팅 (v3).
 *
 *   /            페이지 1  시작
 *   /consent     페이지 2  익명 참여 안내
 *   /needs       페이지 3  현재 감성욕구 입력     (진행 1/7)
 *   /type        페이지 3.5 필코노미 유형 공개    (진행 2/7)
 *   /ratings     페이지 4  소비대안 평가          (진행 3/7)
 *   /svd         페이지 5  SVD 분석              (진행 4/7)
 *   /map         페이지 6  잠재공간 지도          (진행 5/7)
 *   /cluster     페이지 7  군집 판정             (진행 6/7)
 *   /result      페이지 8  최종 결과             (진행 7/7)
 *   /finish      페이지 9  마무리
 *   /admin       관리자
 */

import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { LinkButton, Notice } from '@/components/ui'
import { ClusterPage } from '@/pages/ClusterPage'
import { ConsentPage } from '@/pages/ConsentPage'
import { FinishPage } from '@/pages/FinishPage'
import { MapPage } from '@/pages/MapPage'
import { NeedsPage } from '@/pages/NeedsPage'
import { RatingsPage } from '@/pages/RatingsPage'
import { ResultPage } from '@/pages/ResultPage'
import { StartPage } from '@/pages/StartPage'
import { SvdPage } from '@/pages/SvdPage'
import { TypeRevealPage } from '@/pages/TypeRevealPage'
import { AdminPage } from '@/pages/admin/AdminPage'
import { SessionProvider } from '@/state/SessionContext'

function NotFound() {
  return (
    <div className="space-y-4">
      <Notice tone="warn" title="없는 페이지입니다">
        주소를 다시 확인해 주세요.
      </Notice>
      <LinkButton to="/" variant="secondary">
        ← 시작 화면
      </LinkButton>
    </div>
  )
}

export function App() {
  return (
    <SessionProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<StartPage />} />
          <Route path="/consent" element={<ConsentPage />} />
          <Route path="/needs" element={<NeedsPage />} />
          <Route path="/type" element={<TypeRevealPage />} />
          <Route path="/ratings" element={<RatingsPage />} />
          <Route path="/svd" element={<SvdPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/cluster" element={<ClusterPage />} />
          <Route path="/result" element={<ResultPage />} />
          <Route path="/finish" element={<FinishPage />} />
          <Route path="/admin" element={<AdminPage />} />
          {/* 옛 주소 호환 (v1) */}
          <Route path="/start" element={<Navigate to="/" replace />} />
          <Route path="/emotions" element={<Navigate to="/needs" replace />} />
          <Route path="/consumption" element={<Navigate to="/ratings" replace />} />
          <Route path="/transform" element={<Navigate to="/svd" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </SessionProvider>
  )
}
