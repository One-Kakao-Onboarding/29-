"use client"

import dynamic from "next/dynamic"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, RefreshCw } from "lucide-react"
import { BenefitCard } from "@/components/benefit-card"
import { ConsumptionReport } from "@/components/consumption-report"
import type { AnalysisState, Benefit, Payment, TimePoint } from "@/app/page"
import type { AnnualReportResponse } from "@/services/types"

const Card3D = dynamic(() => import("@/components/card-3d").then((mod) => ({ default: mod.Card3D })), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-32 h-20 rounded-xl bg-white/10 animate-pulse" />
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
    <div className="w-[375px] h-[812px] bg-[#1a1625] flex flex-col rounded-[40px] shadow-2xl overflow-hidden border-8 border-gray-800 relative">
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-800 rounded-b-2xl z-20" />

      {/* Header */}
      <div className="pt-10 pb-4 px-5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">O</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Orott</h1>
            <p className="text-xs text-gray-400">AI 맞춤 카드</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-5 overflow-y-auto relative z-10 pb-8" style={{ minHeight: 0 }}>
        <AnimatePresence mode="wait">
          {analysisState === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex items-center justify-center"
            >
              <div className="text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  className="w-20 h-20 mx-auto mb-6 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center"
                >
                  <Sparkles className="w-8 h-8 text-white/30" />
                </motion.div>
                <p className="text-gray-400 text-sm">왼쪽에서 대화하고</p>
                <p className="text-gray-400 text-sm">분석 버튼을 눌러주세요</p>
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
              <div className="text-center">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                  className="w-16 h-16 mx-auto mb-6 rounded-full bg-purple-600 flex items-center justify-center"
                >
                  <RefreshCw className="w-7 h-7 text-white animate-spin" />
                </motion.div>
                <p className="text-white font-medium text-sm">AI가 분석중이에요...</p>
                <p className="text-gray-400 text-xs mt-2">채팅 & 결제 패턴 분석 중</p>
              </div>
            </motion.div>
          )}

          {analysisState === "complete" && !showReport && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-5"
            >
              <div className="h-48">
                <Card3D benefits={benefits} />
              </div>

              <div>
                <motion.h2
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-lg font-bold text-white"
                >
                  홍길동님,
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-sm text-gray-400"
                >
                  최근 소비 패턴을 분석했어요
                </motion.p>
              </div>

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
      <div className="h-8 bg-transparent flex items-center justify-center relative z-10">
        <div className="w-32 h-1 bg-gray-600 rounded-full" />
      </div>
    </div>
  )
}
