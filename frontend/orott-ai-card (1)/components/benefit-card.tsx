"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronRight, X, Check } from "lucide-react"
import { createPortal } from "react-dom"
import type { Benefit } from "@/app/page"

interface BenefitCardProps {
  benefit: Benefit
  index: number
  alternatives: Benefit[]
  onSwap: (newBenefit: Benefit) => void
}

export function BenefitCard({ benefit, index, alternatives, onSwap }: BenefitCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // 클라이언트 마운트 확인
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // 컨테이너를 직접 찾는 함수 (매번 최신 DOM에서 찾음)
  const getContainer = () => {
    if (buttonRef.current) {
      return buttonRef.current.closest('[data-mobile-container]') as HTMLElement | null
    }
    return null
  }

  const handleOpenModal = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  // 렌더링할 컨테이너 결정
  const portalContainer = isMounted ? getContainer() : null

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.08 }}
      >
        <button
          ref={buttonRef}
          onClick={handleOpenModal}
          className="w-full flex items-center gap-3 py-3 px-3 hover:bg-[#F7F7F7] active:bg-[#E5E5E5] rounded-xl transition-colors text-left group"
        >
          {/* 카테고리 컬러 인디케이터 */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0"
            style={{ backgroundColor: `${benefit.color}20` }}
          >
            {benefit.icon}
          </div>

          {/* 컨텐츠 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-semibold text-[#191919]">{benefit.title}</span>
              <span className="text-[15px] text-[#191919]">{benefit.discount}</span>
            </div>
            <p className="text-[13px] text-[#767676] mt-0.5 truncate">{benefit.reason}</p>
          </div>

          {/* 화살표 */}
          <ChevronRight className="w-5 h-5 text-[#D4D4D4] group-hover:text-[#999999] transition-colors shrink-0" />
        </button>
      </motion.div>

      {/* 혜택 변경 모달 - 모바일 UI 컨테이너 내부에 렌더링 */}
      {isMounted && portalContainer && createPortal(
        <AnimatePresence>
          {isModalOpen && (
            <>
              {/* 백드롭 */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleCloseModal}
                className="absolute inset-0 bg-black/40 z-40 rounded-[34px]"
              />

              {/* 바텀시트 스타일 모달 */}
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 overflow-hidden"
                style={{ maxHeight: "70%" }}
              >
                {/* 핸들바 */}
                <div className="flex justify-center pt-3 pb-2">
                  <div className="w-10 h-1 bg-[#E5E5E5] rounded-full" />
                </div>

                {/* 헤더 */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-[#F7F7F7]">
                  <h3 className="text-lg font-bold text-[#191919]">혜택 변경</h3>
                  <button
                    onClick={handleCloseModal}
                    className="p-2 -mr-2 hover:bg-[#F7F7F7] rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 text-[#767676]" />
                  </button>
                </div>

                {/* 현재 선택된 혜택 */}
                <div className="px-5 py-4 bg-[#FEE500]/10 border-b border-[#FEE500]/20">
                  <p className="text-xs text-[#767676] mb-2">현재 선택</p>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center text-xl"
                      style={{ backgroundColor: `${benefit.color}25` }}
                    >
                      {benefit.icon}
                    </div>
                    <div>
                      <p className="font-semibold text-[#191919]">{benefit.title}</p>
                      <p className="text-sm text-[#555555]">{benefit.discount}</p>
                    </div>
                    <Check className="w-5 h-5 text-[#191919] ml-auto" />
                  </div>
                </div>

                {/* 대체 혜택 목록 */}
                <div className="overflow-y-auto" style={{ maxHeight: "calc(100% - 180px)" }}>
                  <p className="text-xs text-[#767676] px-5 pt-4 pb-2">다른 혜택으로 변경</p>
                  {alternatives.map((alt) => (
                    <button
                      key={alt.id}
                      onClick={() => {
                        onSwap({ ...alt, id: benefit.id })
                        handleCloseModal()
                      }}
                      className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-[#F7F7F7] active:bg-[#E5E5E5] rounded-xl mx-auto transition-colors"
                    >
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center text-xl"
                        style={{ backgroundColor: `${alt.color}15` }}
                      >
                        {alt.icon}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-semibold text-[#191919]">{alt.title}</p>
                        <p className="text-sm text-[#767676]">{alt.discount}</p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* 하단 여백 (safe area) */}
                <div className="h-6 bg-white" />
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        portalContainer
      )}
    </>
  )
}
