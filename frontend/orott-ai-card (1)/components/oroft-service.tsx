"use client"

import dynamic from "next/dynamic"
import { motion, AnimatePresence } from "framer-motion"
import { CreditCard, RefreshCw } from "lucide-react"
import { BenefitCard } from "@/components/benefit-card"
import { ConsumptionReport } from "@/components/consumption-report"
import type { AnalysisState, Benefit, Payment, TimePoint } from "@/app/page"
import type { AnnualReportResponse } from "@/services/types"

const Card3D = dynamic(() => import("@/components/card-3d").then((mod) => ({ default: mod.Card3D })), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-32 h-20 rounded-2xl bg-[#E5E5E5] animate-pulse" />
    </div>
  ),
})

interface OrottServiceProps {
  analysisState: AnalysisState
  benefits: Benefit[]
  alternativeBenefits: Benefit[]
  onSwapBenefit: (id: string, newBenefit: Benefit) => void
  showReport: boolean
  onCloseReport: () => void
  onRebuild: () => void
  payments: Payment[]
  previousPayments?: Payment[] | null
  currentTimePoint: TimePoint
  reportData?: AnnualReportResponse | null
  isReportLoading?: boolean
}

export function OrottService({
  analysisState,
  benefits,
  alternativeBenefits,
  onSwapBenefit,
  showReport,
  onCloseReport,
  onRebuild,
  payments,
  previousPayments,
  currentTimePoint,
  reportData,
  isReportLoading,
}: OrottServiceProps) {
  return (
    <div data-mobile-container className="w-[375px] h-[812px] bg-white flex flex-col rounded-[40px] shadow-lg overflow-hidden border-[6px] border-[#191919] relative isolate">
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#191919] rounded-b-2xl z-20" />

      {/* Header */}
      <div className="pt-10 pb-4 px-5 bg-white border-b border-[#E5E5E5]">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#FEE500] flex items-center justify-center shadow-sm">
            <CreditCard className="w-6 h-6 text-[#191919]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#191919]">Orott</h1>
            <p className="text-sm text-[#767676]">세상에 단 하나밖에 없는 나만을 위한 카드</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-5 overflow-y-auto bg-[#F7F7F7] pb-8" style={{ minHeight: 0 }}>
        <AnimatePresence mode="wait">
          {analysisState === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex items-center justify-center"
            >
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#FEE500]/20 flex items-center justify-center">
                  <CreditCard className="w-10 h-10 text-[#191919]/40" />
                </div>
                <p className="text-[#555555] text-base font-medium mb-2">
                  왼쪽에서 대화를 나눠보세요
                </p>
                <p className="text-[#999999] text-sm">
                  채팅과 결제 내역을 분석해서<br />
                  딱 맞는 혜택을 추천해드릴게요
                </p>
              </div>
            </motion.div>
          )}

          {analysisState === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex items-center justify-center"
            >
              <div className="text-center py-16">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#FEE500] flex items-center justify-center shadow-md"
                >
                  <RefreshCw className="w-8 h-8 text-[#191919]" />
                </motion.div>
                <p className="text-[#191919] font-semibold text-base mb-2">분석 중이에요</p>
                <p className="text-[#767676] text-sm">
                  채팅과 결제 패턴을 살펴보고 있어요
                </p>
                {/* 프로그레스 바 */}
                <div className="mt-6 w-48 mx-auto h-1.5 bg-[#E5E5E5] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                    className="h-full w-1/2 bg-[#FEE500] rounded-full"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {analysisState === "complete" && !showReport && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-5 pt-5"
            >
              {/* 3D 카드 영역 - 투명 배경으로 개방감 있게 */}
              <div className="h-64 relative">
                <Card3D benefits={benefits} />
              </div>

              {/* 인사말 */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E5E5E5]">
                <motion.p
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-lg font-bold text-[#191919]"
                >
                  홍길동님을 위한 혜택이에요
                </motion.p>
                <motion.p
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-sm text-[#767676] mt-1"
                >
                  최근 소비 패턴을 분석했어요.
                </motion.p>
                <motion.p
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-sm text-[#555555] mt-2"
                >
                  혜택을 선택해서 <span className="font-semibold text-[#191919]">나만의 카드를 만들어보세요!</span>
                </motion.p>
              </div>

              {/* 혜택 카드 목록 */}
              <div className="space-y-3">
                {benefits.map((benefit, idx) => (
                  <BenefitCard
                    key={benefit.id}
                    benefit={benefit}
                    index={idx}
                    alternatives={alternativeBenefits}
                    onSwap={(newBenefit) => onSwapBenefit(benefit.id, newBenefit)}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {analysisState === "complete" && showReport && (
            <ConsumptionReport
              onClose={onCloseReport}
              onRebuild={onRebuild}
              reportData={reportData}
              isLoading={isReportLoading}
              payments={payments}
              previousPayments={previousPayments}
              currentTimePoint={currentTimePoint}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Home Indicator */}
      <div className="h-8 bg-white flex items-center justify-center border-t border-[#E5E5E5]">
        <div className="w-32 h-1 bg-[#191919] rounded-full" />
      </div>
    </div>
  )
}
