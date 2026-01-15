"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Trash2, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TIME_POINT_LABELS, type ChatMessage, type TimePoint, type Payment } from "@/app/page"

interface ContextSimulatorProps {
  chatMessages: ChatMessage[]
  onSendMessage: (message: string) => void
  onClearChat: () => void
  selectedPaymentPreset: string
  onPaymentPresetChange: (preset: string) => void
  activeTab: "kakaoTalk" | "kakaoPay"
  currentTimePoint: TimePoint
  onTimePointChange: (timePoint: TimePoint) => void
  payments: Payment[]
}

/**
 * ============================================================
 * TODO: AI API 연동 작업 목록
 * ============================================================
 *
 * [1] 카카오톡 대화 AI 연동
 * ------------------------------------------------------------
 * 현재 상태: Mockup - 사용자 입력에 대해 하드코딩된 응답 반환
 *
 * 필요한 작업:
 * - onSendMessage 콜백에서 실제 AI API 호출 구현
 * - 예상 API 엔드포인트: POST /api/chat
 * - 요청 형태: { message: string, history: ChatMessage[] }
 * - 응답 형태: { response: string }
 * - 스트리밍 응답 지원 시 타이핑 효과 구현 고려
 * - 에러 핸들링 및 로딩 상태 UI 추가 필요
 *
 * 연동 시 수정 필요 파일:
 * - app/page.tsx의 handleSendMessage 함수
 * - 새로 생성: app/api/chat/route.ts
 *
 * ============================================================
 *
 * [2] 소비패턴 분석 AI 연동
 * ------------------------------------------------------------
 * 위치: app/page.tsx의 handleAnalyze 함수
 *
 * 현재 상태: Mockup - 하드코딩된 혜택 목록 반환
 *
 * 필요한 작업:
 * - 채팅 내역 + 결제 내역을 AI에 전송하여 분석
 * - 예상 API 엔드포인트: POST /api/analyze
 * - 요청 형태: { chatHistory: ChatMessage[], payments: Payment[] }
 * - 응답 형태: { benefits: Benefit[], consumptionType: string }
 *
 * ============================================================
 *
 * [3] 라이프스타일 변화 감지 및 재추천 AI 연동
 * ------------------------------------------------------------
 * 위치: components/consumption-report.tsx, app/page.tsx의 handleRebuild 함수
 *
 * 현재 상태: Mockup - 하드코딩된 육아 관련 혜택으로 교체
 *
 * 필요한 작업:
 * - 이전 소비 패턴과 현재 패턴을 비교 분석
 * - 변화된 라이프스타일에 맞는 새 혜택 추천
 * - 예상 API 엔드포인트: POST /api/rebuild
 * - 요청 형태: { previousBenefits: Benefit[], newPattern: ConsumptionPattern }
 * - 응답 형태: { newBenefits: Benefit[], changes: Change[] }
 *
 * ============================================================
 */


export function ContextSimulator({
  chatMessages,
  onSendMessage,
  onClearChat,
  selectedPaymentPreset,
  onPaymentPresetChange,
  activeTab,
  currentTimePoint,
  onTimePointChange,
  payments,
}: ContextSimulatorProps) {
  const [inputValue, setInputValue] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isComposing, setIsComposing] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
    }
  }, [chatMessages])

  const handleSend = useCallback(() => {
    if (!inputValue.trim() || isSending || isComposing) return
    setIsSending(true)
    const message = inputValue.trim()
    setInputValue("")
    // 입력창 직접 초기화 (IME 버퍼 클리어)
    if (inputRef.current) {
      inputRef.current.value = ""
    }
    onSendMessage(message)
    // 짧은 딜레이 후 다시 전송 가능하게
    setTimeout(() => setIsSending(false), 100)
  }, [inputValue, isSending, isComposing, onSendMessage])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !isComposing) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    handleSend()
  }

  const handleCompositionStart = () => {
    setIsComposing(true)
  }

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    setIsComposing(false)
    setInputValue(e.currentTarget.value)
  }

  const timePoints: TimePoint[] = ["A", "B", "C"]

  return (
    <div className="w-[375px] h-[812px] bg-[#f5f5f5] flex flex-col rounded-[40px] shadow-2xl overflow-hidden border-8 border-gray-800 relative">
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-800 rounded-b-2xl z-20" />

      <AnimatePresence mode="wait">
        {activeTab === "kakaoTalk" ? (
          <motion.div
            key="kakaoTalk"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex flex-col h-full"
          >
            {/* KakaoTalk Header */}
            <div className="bg-[#b2c7d9] pt-10 pb-3 px-4 flex-shrink-0">
              <h2 className="text-lg font-bold text-[#3c1e1e] text-center">AI 친구</h2>
              <p className="text-xs text-[#5c4c4c] text-center mt-1">대화를 나눠보세요</p>
            </div>

            {/* Chat Header with Clear Button */}
            <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-100 flex-shrink-0">
              <span className="text-xs text-gray-500">채팅</span>
              <button
                onClick={onClearChat}
                className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                비우기
              </button>
            </div>

            <div
              ref={scrollContainerRef}
              className="flex-1 p-4 bg-[#b2c7d9] overflow-y-auto"
              style={{ height: "calc(100% - 180px)" }}
            >
              <div className="space-y-3">
                {chatMessages.length === 0 ? (
                  <div className="flex items-center justify-center text-[#5c6c7c] py-20">
                    <div className="text-center">
                      <p className="text-sm font-medium">대화를 시작해보세요</p>
                      <p className="text-xs mt-1">여행, 육아 등 관심사를 얘기해보세요</p>
                    </div>
                  </div>
                ) : (
                  chatMessages.map((msg, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                          msg.sender === "me" ? "bg-[#fee500] text-[#3c1e1e]" : "bg-white text-gray-800"
                        }`}
                      >
                        <p className="text-sm">{msg.message}</p>
                        <p className="text-[10px] opacity-60 mt-1">{msg.time}</p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            {/* Input - 하단 고정 */}
            <div className="p-3 border-t border-gray-200 bg-white flex-shrink-0">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onCompositionStart={handleCompositionStart}
                  onCompositionEnd={handleCompositionEnd}
                  placeholder="메시지를 입력하세요..."
                  className="flex-1 bg-gray-50 border-gray-200"
                />
                <Button
                  onClick={handleButtonClick}
                  disabled={isSending}
                  size="icon"
                  className="bg-[#fee500] text-[#3c1e1e] hover:bg-[#fdd835]"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Home Indicator */}
            <div className="h-8 bg-white flex items-center justify-center flex-shrink-0">
              <div className="w-32 h-1 bg-gray-300 rounded-full" />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="kakaoPay"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex flex-col h-full"
          >
            {/* KakaoPay Header */}
            <div className="bg-[#fee500] pt-10 pb-3 px-4 flex-shrink-0">
              <h2 className="text-lg font-bold text-[#3c1e1e] text-center">카카오페이</h2>
              <p className="text-xs text-[#5c4c4c] text-center mt-1">결제 내역</p>
            </div>

            {/* 시점 선택 버튼 */}
            <div className="px-4 py-3 border-b border-gray-100 bg-white flex-shrink-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">시점 선택</span>
                <span className="text-xs text-gray-400">{TIME_POINT_LABELS[currentTimePoint].period}</span>
              </div>
              <div className="flex gap-2">
                {timePoints.map((point) => (
                  <button
                    key={point}
                    onClick={() => onTimePointChange(point)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      currentTimePoint === point
                        ? "bg-[#fee500] text-[#3c1e1e] shadow-sm"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <div className="text-center">
                      <span className="block font-bold">{point}</span>
                      <span className="block text-[10px] opacity-70">{TIME_POINT_LABELS[point].period}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Payment List */}
            <div className="flex-1 p-4 overflow-y-auto bg-white">
              <div className="space-y-2">
                {payments.map((payment, idx) => (
                  <motion.div
                    key={`${currentTimePoint}-${idx}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800">{payment.merchant}</p>
                      <p className="text-xs text-gray-500">{payment.date} · {payment.category}</p>
                    </div>
                    <p className="text-sm font-semibold text-[#3c1e1e]">{payment.amount}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Home Indicator */}
            <div className="h-8 bg-white flex items-center justify-center flex-shrink-0">
              <div className="w-32 h-1 bg-gray-300 rounded-full" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
