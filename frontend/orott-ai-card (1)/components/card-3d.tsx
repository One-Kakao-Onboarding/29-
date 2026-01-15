"use client"

import type React from "react"
import { useState, useRef, useMemo, useCallback } from "react"
import type { Benefit } from "@/app/page"

/**
 * ============================================================================
 * 혜택별 카드 색상 시스템 - 원장 데이터 (Master Data)
 * ============================================================================
 *
 * [절대 불변] 이 카테고리와 색상 매핑은 원장 데이터입니다.
 * 임의로 추가/수정/삭제하지 마세요. 변경이 필요하면 기획팀과 협의하세요.
 *
 * ┌─────────────┬───────────────┬─────────────────────────────────────────────┐
 * │ 카테고리    │ 색상 (HEX)    │ 해당 브랜드/서비스 (원장)                   │
 * ├─────────────┼───────────────┼─────────────────────────────────────────────┤
 * │ 카페        │ #22c55e 초록  │ 스타벅스, 할리스, 투썸                      │
 * │ 영화관      │ #f97316 주황  │ CGV, 메가박스, 롯데시네마                   │
 * │ 배달        │ #eab308 노랑  │ 배달의민족, 쿠팡잇츠                        │
 * │ OTT         │ #ef4444 빨강  │ 넷플릭스, 디즈니+, 티빙, 웨이브             │
 * │ 교통        │ #3b82f6 파랑  │ 시내버스, 시외버스, 지하철                  │
 * │ 편의점      │ #a855f7 보라  │ CU, GS25, 세븐일레븐, emart everyday        │
 * │ 주유        │ #84cc16 연두  │ S-oil, 현대오일뱅크, SK                     │
 * │ 쇼핑        │ #ec4899 핑크  │ 무신사, 지그재그, 8-seconds, W컨셉, 29cm    │
 * │ 공항        │ #06b6d4 하늘  │ 공항라운지, 대한항공, 아시아나, 진에어      │
 * │ 마트        │ #a16207 갈색  │ 이마트, 롯데마트                            │
 * └─────────────┴───────────────┴─────────────────────────────────────────────┘
 *
 * [주의사항]
 * 1. 위 10개 카테고리가 전부입니다. 이 외의 카테고리는 존재하지 않습니다.
 * 2. AI가 혜택을 추천할 때 반드시 위 카테고리 중 하나를 사용해야 합니다.
 * 3. 브랜드는 반드시 해당 카테고리 안에서만 선택되어야 합니다.
 * 4. 새로운 브랜드가 추가되면 기존 카테고리에 매핑해야 합니다.
 *
 * ============================================================================
 * TODO: AI 연동 작업
 * ============================================================================
 *
 * AI 프롬프트에 반드시 포함할 내용:
 * - 카테고리는 위 10개로 제한
 * - 각 카테고리별 브랜드 목록 명시
 * - category 필드 값은 한글로 정확히 (OTT는 영어 허용)
 *
 * ============================================================================
 */

// [원장 데이터] 절대 임의 수정 금지!
// 이 10개 카테고리가 전부이며, 추가 카테고리는 없습니다.
const CATEGORY_COLORS: Record<string, string> = {
  카페: "#22c55e", // 초록 - 스타벅스, 할리스, 투썸
  영화관: "#f97316", // 주황 - CGV, 메가박스, 롯데시네마
  배달: "#eab308", // 노랑 - 배달의민족, 쿠팡잇츠
  OTT: "#ef4444", // 빨강 - 넷플릭스, 디즈니+, 티빙, 웨이브
  교통: "#3b82f6", // 파랑 - 시내버스, 시외버스, 지하철
  편의점: "#a855f7", // 보라 - CU, GS25, 세븐일레븐, emart everyday
  주유: "#84cc16", // 연두 - S-oil, 현대오일뱅크, SK
  쇼핑: "#ec4899", // 핑크 - 무신사, 지그재그, 8-seconds, W컨셉, 29cm
  공항: "#06b6d4", // 하늘 - 공항라운지, 대한항공, 아시아나, 진에어
  마트: "#a16207", // 갈색 - 이마트, 롯데마트
}

// 브랜드 → 카테고리 매핑 (원장 데이터 기반)
// AI 연동 전 fallback용, 브랜드명으로 카테고리 추론
const BRAND_TO_CATEGORY: Record<string, string> = {
  // 카페
  스타벅스: "카페",
  할리스: "카페",
  투썸: "카페",
  // 영화관
  cgv: "영화관",
  메가박스: "영화관",
  롯데시네마: "영화관",
  // 배달
  배달의민족: "배달",
  쿠팡잇츠: "배달",
  // OTT
  넷플릭스: "OTT",
  넷플: "OTT",
  디즈니: "OTT",
  티빙: "OTT",
  웨이브: "OTT",
  // 교통
  시내버스: "교통",
  시외버스: "교통",
  지하철: "교통",
  // 편의점
  cu: "편의점",
  gs25: "편의점",
  세븐일레븐: "편의점",
  "emart everyday": "편의점",
  // 주유
  "s-oil": "주유",
  현대오일뱅크: "주유",
  sk: "주유",
  // 쇼핑
  무신사: "쇼핑",
  지그재그: "쇼핑",
  "8-seconds": "쇼핑",
  w컨셉: "쇼핑",
  "29cm": "쇼핑",
  // 공항
  공항라운지: "공항",
  대한항공: "공항",
  아시아나: "공항",
  진에어: "공항",
  // 마트
  이마트: "마트",
  롯데마트: "마트",
}

function getBenefitColors(benefits: Benefit[]): string[] {
  const colors: string[] = []

  for (const benefit of benefits) {
    // 1순위: category 필드가 CATEGORY_COLORS에 있으면 사용
    if (benefit.category && CATEGORY_COLORS[benefit.category]) {
      colors.push(CATEGORY_COLORS[benefit.category])
      continue
    }

    // 2순위: title에서 브랜드명으로 카테고리 추론
    const title = benefit.title.toLowerCase()
    let found = false
    for (const [brand, category] of Object.entries(BRAND_TO_CATEGORY)) {
      if (title.includes(brand.toLowerCase())) {
        colors.push(CATEGORY_COLORS[category])
        found = true
        break
      }
    }

    // 매칭 실패 시 기본 색상 사용 안함 (그라데이션에서 제외)
    if (!found) {
      console.warn(`[Card3D] 카테고리 매핑 실패: ${benefit.title} (category: ${benefit.category})`)
    }
  }

  return colors
}

function generateGradientFromColors(colors: string[]): string {
  if (colors.length === 0) {
    // 기본 그라데이션 (혜택이 없을 때)
    return "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)"
  }

  if (colors.length === 1) {
    // 단일 색상: 해당 색상의 밝은/어두운 버전으로 그라데이션
    return `linear-gradient(135deg, ${colors[0]} 0%, ${adjustColor(colors[0], 30)} 50%, ${adjustColor(colors[0], -20)} 100%)`
  }

  if (colors.length === 2) {
    return `linear-gradient(135deg, ${colors[0]} 0%, ${adjustColor(colors[0], 20)} 30%, ${adjustColor(colors[1], 20)} 70%, ${colors[1]} 100%)`
  }

  if (colors.length === 3) {
    return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 50%, ${colors[2]} 100%)`
  }

  // 4개 이상
  return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 33%, ${colors[2]} 66%, ${colors[3] || colors[0]} 100%)`
}

// 색상 밝기 조절 헬퍼 함수
function adjustColor(hex: string, percent: number): string {
  const num = Number.parseInt(hex.replace("#", ""), 16)
  const amt = Math.round(2.55 * percent)
  const R = Math.min(255, Math.max(0, (num >> 16) + amt))
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt))
  const B = Math.min(255, Math.max(0, (num & 0x0000ff) + amt))
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`
}

interface Card3DProps {
  benefits: Benefit[]
}

export function Card3D({ benefits }: Card3DProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [rotation, setRotation] = useState({ x: 5, y: -5 })
  const [isDragging, setIsDragging] = useState(false)
  const lastPos = useRef({ x: 0, y: 0 })

  const gradient = useMemo(() => {
    const colors = getBenefitColors(benefits)
    return {
      bg: generateGradientFromColors(colors),
      colors: colors,
    }
  }, [benefits])

  const handleStart = useCallback((clientX: number, clientY: number) => {
    setIsDragging(true)
    lastPos.current = { x: clientX, y: clientY }
  }, [])

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDragging) return
      const deltaX = clientX - lastPos.current.x
      const deltaY = clientY - lastPos.current.y
      setRotation((prev) => ({
        x: Math.max(-30, Math.min(30, prev.x - deltaY * 0.4)),
        y: Math.max(-40, Math.min(40, prev.y + deltaX * 0.4)),
      }))
      lastPos.current = { x: clientX, y: clientY }
    },
    [isDragging],
  )

  const handleEnd = useCallback(() => setIsDragging(false), [])

  const onMouseDown = (e: React.MouseEvent) => handleStart(e.clientX, e.clientY)
  const onMouseMove = (e: React.MouseEvent) => handleMove(e.clientX, e.clientY)
  const onMouseUp = () => handleEnd()
  const onMouseLeave = () => handleEnd()
  const onTouchStart = (e: React.TouchEvent) => handleStart(e.touches[0].clientX, e.touches[0].clientY)
  const onTouchMove = (e: React.TouchEvent) => handleMove(e.touches[0].clientX, e.touches[0].clientY)
  const onTouchEnd = () => handleEnd()

  return (
    <div className="w-full h-full flex items-center justify-center p-4" style={{ perspective: "1200px" }}>
      <div
        ref={cardRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className="relative cursor-grab active:cursor-grabbing select-none"
        style={{
          width: "300px",
          height: "190px",
          transformStyle: "preserve-3d",
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
          transition: isDragging ? "none" : "transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)",
        }}
      >
        {/* 카드 본체 */}
        <div
          className="absolute inset-0 rounded-xl overflow-hidden"
          style={{
            background: gradient.bg,
            boxShadow: `
              0 30px 60px -15px rgba(0, 0, 0, 0.35),
              0 0 1px 0 rgba(0,0,0,0.3),
              inset 0 0 0 1px rgba(255,255,255,0.15)
            `,
            backfaceVisibility: "hidden",
          }}
        >
          {/* 글로시 하이라이트 */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `
                linear-gradient(
                  105deg,
                  rgba(255,255,255,0.4) 0%,
                  rgba(255,255,255,0.1) 40%,
                  transparent 50%,
                  transparent 100%
                )
              `,
            }}
          />

          {/* 카드 콘텐츠 */}
          <div className="absolute inset-0 p-5 flex flex-col justify-between">
            {/* 상단: IC 칩 */}
            <div className="flex items-start justify-between">
              <div
                className="relative"
                style={{
                  width: "45px",
                  height: "34px",
                  borderRadius: "5px",
                  background:
                    "linear-gradient(160deg, #F7E7A0 0%, #D4AF37 20%, #C5A028 50%, #B8922A 80%, #A67C00 100%)",
                  boxShadow: `
                    0 2px 4px rgba(0,0,0,0.3),
                    0 1px 2px rgba(0,0,0,0.2),
                    inset 0 1px 0 rgba(255,255,255,0.5),
                    inset 0 -1px 0 rgba(0,0,0,0.15)
                  `,
                }}
              >
                {/* 칩 내부 패턴 - 실제 EMV 칩 레이아웃 */}
                <div className="absolute inset-[3px]">
                  {/* 좌측 큰 패드 */}
                  <div
                    className="absolute left-0 top-0 bottom-0 rounded-l-sm"
                    style={{
                      width: "45%",
                      background: "linear-gradient(180deg, #CFAA45 0%, #B8922A 50%, #A67C00 100%)",
                      boxShadow: "inset 0 0 1px rgba(0,0,0,0.4)",
                    }}
                  />
                  {/* 우측 상단 작은 패드들 */}
                  <div className="absolute right-0 top-0 flex flex-col gap-[2px]" style={{ width: "50%" }}>
                    <div
                      className="h-[9px] rounded-r-sm"
                      style={{
                        background: "linear-gradient(180deg, #E8D070 0%, #C5A028 100%)",
                        boxShadow: "inset 0 0 1px rgba(0,0,0,0.3)",
                      }}
                    />
                    <div
                      className="h-[9px] rounded-r-sm"
                      style={{
                        background: "linear-gradient(180deg, #CFAA45 0%, #B8922A 100%)",
                        boxShadow: "inset 0 0 1px rgba(0,0,0,0.35)",
                      }}
                    />
                    <div
                      className="h-[9px] rounded-r-sm"
                      style={{
                        background: "linear-gradient(180deg, #E8D070 0%, #C5A028 100%)",
                        boxShadow: "inset 0 0 1px rgba(0,0,0,0.3)",
                      }}
                    />
                  </div>
                  {/* 중앙 분리선 */}
                  <div
                    className="absolute top-0 bottom-0"
                    style={{
                      left: "45%",
                      width: "1px",
                      background: "linear-gradient(180deg, rgba(0,0,0,0.3), rgba(0,0,0,0.15), rgba(0,0,0,0.3))",
                    }}
                  />
                </div>
                {/* 칩 표면 광택 */}
                <div
                  className="absolute inset-0 rounded-[5px]"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(255,255,255,0.35) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.1) 100%)",
                  }}
                />
              </div>

              {/* NFC 아이콘 */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.6 }}>
                <path
                  d="M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10-4.5 10-10 10z"
                  stroke="rgba(255,255,255,0.8)"
                  strokeWidth="1.5"
                  fill="none"
                />
                <path
                  d="M8.5 12a3.5 3.5 0 013.5-3.5"
                  stroke="rgba(255,255,255,0.8)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path d="M6 12a6 6 0 016-6" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>

            {/* 하단: 카드 정보 */}
            <div className="space-y-3">
              {/* 카드 번호 */}
              <p
                className="font-mono text-sm tracking-[0.2em]"
                style={{
                  color: "rgba(255,255,255,0.9)",
                  textShadow: "0 1px 3px rgba(0,0,0,0.3)",
                  letterSpacing: "0.2em",
                }}
              >
                •••• •••• •••• ••••
              </p>

              {/* 카드 소유자 & 유효기간 & 로고 */}
              <div className="flex items-end justify-between">
                <div className="flex gap-6">
                  <div>
                    <p
                      className="text-[9px] uppercase tracking-wider mb-0.5"
                      style={{ color: "rgba(255,255,255,0.5)" }}
                    >
                      Card Holder
                    </p>
                    <p
                      className="text-xs font-medium tracking-wide"
                      style={{
                        color: "rgba(255,255,255,0.85)",
                        textShadow: "0 1px 2px rgba(0,0,0,0.2)",
                      }}
                    >
                      YOUR NAME
                    </p>
                  </div>
                  <div>
                    <p
                      className="text-[9px] uppercase tracking-wider mb-0.5"
                      style={{ color: "rgba(255,255,255,0.5)" }}
                    >
                      Expires
                    </p>
                    <p
                      className="text-xs font-medium tracking-wide"
                      style={{
                        color: "rgba(255,255,255,0.85)",
                        textShadow: "0 1px 2px rgba(0,0,0,0.2)",
                      }}
                    >
                      ••/••
                    </p>
                  </div>
                </div>

                {/* 로고 */}
                <p
                  className="font-bold text-2xl tracking-wide"
                  style={{
                    color: "rgba(255,255,255,0.95)",
                    textShadow: "0 2px 4px rgba(0,0,0,0.25)",
                    fontFamily: "system-ui, -apple-system, sans-serif",
                  }}
                >
                  Orott
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 카드 뒷면 */}
        <div
          className="absolute inset-0 rounded-xl"
          style={{
            background: "linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%)",
            transform: "rotateY(180deg)",
            backfaceVisibility: "hidden",
          }}
        >
          {/* 마그네틱 띠 */}
          <div className="absolute top-8 left-0 right-0 h-10" style={{ background: "#111" }} />
          {/* 서명란 */}
          <div className="absolute top-24 left-4 right-16 h-8 rounded" style={{ background: "#f5f5f5" }} />
          {/* CVV */}
          <div className="absolute top-24 right-4 flex items-center h-8">
            <span className="text-white/60 text-xs font-mono">•••</span>
          </div>
        </div>
      </div>
    </div>
  )
}
