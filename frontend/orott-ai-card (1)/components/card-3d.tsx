"use client";

import type React from "react";
import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import type { Benefit } from "@/app/page";

/**
 * ============================================================================
 * 혜택별 카드 색상 시스템 - 원장 데이터 (Master Data)
 * ============================================================================
 */

const CATEGORY_COLORS: Record<string, string> = {
  카페: "#22c55e",
  영화관: "#f97316",
  배달: "#eab308",
  OTT: "#ef4444",
  교통: "#3b82f6",
  편의점: "#a855f7",
  주유: "#84cc16",
  쇼핑: "#ec4899",
  공항: "#06b6d4",
  마트: "#a16207",
};

const BRAND_TO_CATEGORY: Record<string, string> = {
  스타벅스: "카페",
  할리스: "카페",
  투썸: "카페",
  cgv: "영화관",
  메가박스: "영화관",
  롯데시네마: "영화관",
  배달의민족: "배달",
  쿠팡잇츠: "배달",
  넷플릭스: "OTT",
  넷플: "OTT",
  디즈니: "OTT",
  티빙: "OTT",
  웨이브: "OTT",
  시내버스: "교통",
  시외버스: "교통",
  지하철: "교통",
  cu: "편의점",
  gs25: "편의점",
  세븐일레븐: "편의점",
  "emart everyday": "편의점",
  "s-oil": "주유",
  현대오일뱅크: "주유",
  sk: "주유",
  무신사: "쇼핑",
  지그재그: "쇼핑",
  "8-seconds": "쇼핑",
  w컨셉: "쇼핑",
  "29cm": "쇼핑",
  공항라운지: "공항",
  대한항공: "공항",
  아시아나: "공항",
  진에어: "공항",
  이마트: "마트",
  롯데마트: "마트",
};

function getBenefitColors(benefits: Benefit[]): string[] {
  const colors: string[] = [];

  for (const benefit of benefits) {
    if (benefit.category && CATEGORY_COLORS[benefit.category]) {
      colors.push(CATEGORY_COLORS[benefit.category]);
      continue;
    }

    const title = benefit.title.toLowerCase();
    let found = false;
    for (const [brand, category] of Object.entries(BRAND_TO_CATEGORY)) {
      if (title.includes(brand.toLowerCase())) {
        colors.push(CATEGORY_COLORS[category]);
        found = true;
        break;
      }
    }

    if (!found) {
      console.warn(
        `[Card3D] 카테고리 매핑 실패: ${benefit.title} (category: ${benefit.category})`
      );
    }
  }

  return colors;
}

function generateGradientFromColors(colors: string[]): string {
  if (colors.length === 0) {
    return "linear-gradient(135deg, #191919 0%, #333333 50%, #191919 100%)";
  }

  if (colors.length === 1) {
    // 단일 색상 - 전체를 채우면서 깊이감
    return `
      radial-gradient(ellipse 120% 120% at 20% 20%, ${colors[0]} 0%, ${adjustColor(colors[0], -10)} 50%, ${adjustColor(colors[0], -25)} 100%)
    `;
  }

  if (colors.length === 2) {
    // 두 색상 - 대각선으로 영역 분할, 중앙에서 부드럽게 만남
    return `
      radial-gradient(ellipse 140% 140% at 0% 0%, ${colors[0]} 0%, ${colors[0]}90 30%, transparent 60%),
      radial-gradient(ellipse 140% 140% at 100% 100%, ${colors[1]} 0%, ${colors[1]}90 30%, transparent 60%),
      linear-gradient(135deg, ${colors[0]}80 0%, ${colors[1]}80 100%)
    `;
  }

  if (colors.length === 3) {
    // 세 색상 - 삼각형 형태, 중앙까지 확장
    return `
      radial-gradient(ellipse 130% 130% at 0% 0%, ${colors[0]} 0%, ${colors[0]}80 25%, transparent 55%),
      radial-gradient(ellipse 130% 130% at 100% 0%, ${colors[1]} 0%, ${colors[1]}80 25%, transparent 55%),
      radial-gradient(ellipse 130% 130% at 50% 100%, ${colors[2]} 0%, ${colors[2]}80 25%, transparent 55%),
      linear-gradient(180deg, ${colors[0]}60 0%, ${colors[1]}60 50%, ${colors[2]}60 100%)
    `;
  }

  // 네 색상 이상 - 각 코너에서 중앙을 향해 확장
  return `
    radial-gradient(ellipse 120% 120% at 0% 0%, ${colors[0]} 0%, ${colors[0]}70 20%, transparent 50%),
    radial-gradient(ellipse 120% 120% at 100% 0%, ${colors[1]} 0%, ${colors[1]}70 20%, transparent 50%),
    radial-gradient(ellipse 120% 120% at 100% 100%, ${colors[2]} 0%, ${colors[2]}70 20%, transparent 50%),
    radial-gradient(ellipse 120% 120% at 0% 100%, ${colors[3] || colors[0]} 0%, ${colors[3] || colors[0]}70 20%, transparent 50%),
    linear-gradient(135deg, ${colors[0]}50 0%, ${colors[1]}50 33%, ${colors[2]}50 66%, ${colors[3] || colors[0]}50 100%)
  `;
}

function adjustColor(hex: string, percent: number): string {
  const num = Number.parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, (num >> 16) + amt));
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt));
  const B = Math.min(255, Math.max(0, (num & 0x0000ff) + amt));
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

interface Card3DProps {
  benefits: Benefit[];
}

// 기본 기울기 상태 (10도 정도 기울어진 상태)
const DEFAULT_ROTATION = { x: 8, y: -12 };

export function Card3D({ benefits }: Card3DProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState(DEFAULT_ROTATION);
  const [isDragging, setIsDragging] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [bounceY, setBounceY] = useState(0);
  const [isBouncing, setIsBouncing] = useState(false);
  const [idleOffset, setIdleOffset] = useState({ x: 0, y: 0 });
  const lastPos = useRef({ x: 0, y: 0 });
  const prevGradientRef = useRef<string>("");
  const isFirstRender = useRef(true);
  const bounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const idleAnimationRef = useRef<number | null>(null);

  const gradient = useMemo(() => {
    const colors = getBenefitColors(benefits);
    return {
      bg: generateGradientFromColors(colors),
      colors: colors,
    };
  }, [benefits]);

  // 감쇠 바운스 애니메이션 (농구공이 멈춰가는 느낌: 통! 통통..)
  const startDampedBounce = useCallback(() => {
    if (bounceTimeoutRef.current) {
      clearTimeout(bounceTimeoutRef.current);
    }

    setIsBouncing(true);

    // 바운스 시퀀스: 점점 작아지는 높이와 빨라지는 간격
    const bounceSequence = [
      { y: -20, duration: 200 },  // 첫 번째 큰 바운스 (통!)
      { y: 0, duration: 150 },
      { y: -10, duration: 120 },  // 두 번째 중간 바운스 (통)
      { y: 0, duration: 100 },
      { y: -4, duration: 80 },    // 세 번째 작은 바운스 (통..)
      { y: 0, duration: 60 },
      { y: -1, duration: 50 },    // 마지막 미세 바운스
      { y: 0, duration: 40 },
    ];

    let totalDelay = 0;
    bounceSequence.forEach((step, index) => {
      bounceTimeoutRef.current = setTimeout(() => {
        setBounceY(step.y);
        if (index === bounceSequence.length - 1) {
          setIsBouncing(false);
        }
      }, totalDelay);
      totalDelay += step.duration;
    });
  }, []);

  // 처음 마운트될 때 또는 그라데이션이 변경될 때 애니메이션 실행
  useEffect(() => {
    if (isFirstRender.current) {
      // 첫 렌더링 시 입장 애니메이션 - 부드럽고 우아하게 회전
      isFirstRender.current = false;
      setIsSpinning(true);
      setRotation({ x: -10, y: 180 });

      setTimeout(() => {
        setRotation(DEFAULT_ROTATION);
        setTimeout(() => setIsSpinning(false), 1000);
      }, 1200);
    } else if (prevGradientRef.current !== gradient.bg) {
      // 그라데이션 변경 시 - 회전 없이 감쇠 바운스만
      startDampedBounce();
    }

    prevGradientRef.current = gradient.bg;
  }, [gradient.bg, startDampedBounce]);

  // Idle 애니메이션 - 가만히 있을 때 살짝살짝 흔들림
  useEffect(() => {
    let startTime: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      // 드래그 중이거나 스피닝/바운싱 중이면 idle 애니메이션 멈춤
      if (!isDragging && !isSpinning && !isBouncing) {
        // 부드러운 사인파 움직임 (서로 다른 주기로 x, y 움직임)
        const offsetX = Math.sin(elapsed * 0.0008) * 2;  // 느린 좌우 흔들림
        const offsetY = Math.sin(elapsed * 0.0012) * 1.5; // 약간 다른 주기의 상하 흔들림
        setIdleOffset({ x: offsetX, y: offsetY });
      } else {
        setIdleOffset({ x: 0, y: 0 });
      }

      idleAnimationRef.current = requestAnimationFrame(animate);
    };

    idleAnimationRef.current = requestAnimationFrame(animate);

    return () => {
      if (idleAnimationRef.current) {
        cancelAnimationFrame(idleAnimationRef.current);
      }
    };
  }, [isDragging, isSpinning, isBouncing]);

  // 클린업
  useEffect(() => {
    return () => {
      if (bounceTimeoutRef.current) {
        clearTimeout(bounceTimeoutRef.current);
      }
    };
  }, []);

  const handleStart = useCallback(
    (clientX: number, clientY: number) => {
      if (isSpinning) return;
      setIsDragging(true);
      lastPos.current = { x: clientX, y: clientY };
    },
    [isSpinning]
  );

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDragging || isSpinning) return;
      const deltaX = clientX - lastPos.current.x;
      const deltaY = clientY - lastPos.current.y;
      setRotation((prev) => ({
        x: Math.max(-20, Math.min(20, prev.x - deltaY * 0.3)),
        y: Math.max(-30, Math.min(30, prev.y + deltaX * 0.3)),
      }));
      lastPos.current = { x: clientX, y: clientY };
    },
    [isDragging, isSpinning]
  );

  const handleEnd = useCallback(() => setIsDragging(false), []);

  const onMouseDown = (e: React.MouseEvent) =>
    handleStart(e.clientX, e.clientY);
  const onMouseMove = (e: React.MouseEvent) => handleMove(e.clientX, e.clientY);
  const onMouseUp = () => handleEnd();
  const onMouseLeave = () => handleEnd();
  const onTouchStart = (e: React.TouchEvent) =>
    handleStart(e.touches[0].clientX, e.touches[0].clientY);
  const onTouchMove = (e: React.TouchEvent) =>
    handleMove(e.touches[0].clientX, e.touches[0].clientY);
  const onTouchEnd = () => handleEnd();

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center p-4"
      style={{ perspective: "1000px" }}
    >
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
          width: "320px",
          height: "240px",
          transformStyle: "preserve-3d",
          transform: `rotateX(${rotation.x + idleOffset.y}deg) rotateY(${rotation.y + idleOffset.x}deg) translateY(${bounceY}px)`,
          transition: isDragging
            ? "none"
            : isSpinning
            ? "transform 1.2s cubic-bezier(0.23, 1, 0.32, 1)"
            : isBouncing
            ? "transform 0.08s ease-out"
            : "transform 0.5s ease-out",
        }}
      >
        {/* 카드 본체 */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden"
          style={{
            background: gradient.bg,
            boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.25)",
            backfaceVisibility: "hidden",
            transition: "background 0.6s ease-in-out",
          }}
        >
          {/* 심플한 광택 효과 */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 50%, transparent 100%)",
            }}
          />

          {/* 카드 콘텐츠 */}
          <div className="absolute inset-0 p-5 flex flex-col justify-between">
            {/* 상단 - 컨택리스 아이콘만 */}
            <div className="flex items-start justify-end">
              {/* 컨택리스 아이콘 */}
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                style={{ opacity: 0.7 }}
              >
                <path
                  d="M8.5 12a3.5 3.5 0 013.5-3.5"
                  stroke="rgba(255,255,255,0.9)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M5.5 12a6.5 6.5 0 016.5-6.5"
                  stroke="rgba(255,255,255,0.9)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M2.5 12a9.5 9.5 0 019.5-9.5"
                  stroke="rgba(255,255,255,0.9)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* IC 칩 - 좌측 중간 */}
            <div
              className="w-12 h-9 rounded-md absolute left-5 top-1/2 -translate-y-1/2 overflow-hidden"
              style={{
                background:
                  "linear-gradient(145deg, #F7E7A0 0%, #D4AF37 50%, #B8922A 100%)",
                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
              }}
            >
              {/* 회로 패턴 */}
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 48 36"
                fill="none"
              >
                {/* 가로 실금 */}
                <line x1="0" y1="12" x2="48" y2="12" stroke="#B8922A" strokeWidth="0.5" />
                <line x1="0" y1="18" x2="48" y2="18" stroke="#B8922A" strokeWidth="0.5" />
                <line x1="0" y1="24" x2="48" y2="24" stroke="#B8922A" strokeWidth="0.5" />
                {/* 세로 실금 */}
                <line x1="12" y1="0" x2="12" y2="36" stroke="#B8922A" strokeWidth="0.5" />
                <line x1="24" y1="0" x2="24" y2="36" stroke="#B8922A" strokeWidth="0.5" />
                <line x1="36" y1="0" x2="36" y2="36" stroke="#B8922A" strokeWidth="0.5" />
                {/* 중앙 접점 영역 */}
                <rect x="14" y="8" width="8" height="8" fill="#C9A227" rx="1" />
                <rect x="26" y="8" width="8" height="8" fill="#C9A227" rx="1" />
                <rect x="14" y="20" width="8" height="8" fill="#C9A227" rx="1" />
                <rect x="26" y="20" width="8" height="8" fill="#C9A227" rx="1" />
              </svg>
            </div>

            {/* 하단 */}
            <div className="space-y-2">
              {/* 카드 번호 */}
              <p
                className="font-mono text-sm tracking-widest"
                style={{
                  color: "rgba(255,255,255,0.9)",
                  textShadow: "0 1px 2px rgba(0,0,0,0.2)",
                }}
              >
                •••• •••• •••• ••••
              </p>

              {/* 카드홀더 & 유효기간 & 로고 */}
              <div className="flex items-end justify-between">
                <div className="flex gap-5">
                  <div>
                    <p
                      className="text-[10px] uppercase tracking-wider"
                      style={{ color: "rgba(255,255,255,0.5)" }}
                    >
                      NAME
                    </p>
                    <p
                      className="text-xs font-medium"
                      style={{ color: "rgba(255,255,255,0.9)" }}
                    >
                      홍길동
                    </p>
                  </div>
                  <div>
                    <p
                      className="text-[10px] uppercase tracking-wider"
                      style={{ color: "rgba(255,255,255,0.5)" }}
                    >
                      VALID
                    </p>
                    <p
                      className="text-xs font-medium"
                      style={{ color: "rgba(255,255,255,0.9)" }}
                    >
                      12/28
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 카드 뒷면 */}
        <div
          className="absolute inset-0 rounded-2xl"
          style={{
            background: "#191919",
            transform: "rotateY(180deg)",
            backfaceVisibility: "hidden",
          }}
        >
          <div
            className="absolute top-6 left-0 right-0 h-10"
            style={{ background: "#333333" }}
          />
          <div className="absolute top-20 left-4 right-16 h-8 rounded bg-white" />
          <div className="absolute top-20 right-4 flex items-center h-8">
            <span className="text-white/60 text-xs font-mono">CVV</span>
          </div>
        </div>
      </div>

      {/* 드래그 힌트 화살표 */}
      <div className="flex items-center gap-3 mt-3">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#D4D4D4"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
        <span className="text-[11px] text-[#D4D4D4]">드래그하여 회전</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#D4D4D4"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </div>
  );
}
