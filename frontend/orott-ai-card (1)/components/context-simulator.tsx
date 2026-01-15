"use client";

import type React from "react";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  TIME_POINT_LABELS,
  type ChatMessage,
  type TimePoint,
  type Payment,
} from "@/app/page";

interface ContextSimulatorProps {
  chatMessages: ChatMessage[];
  onSendMessage: (message: string) => void;
  onClearChat: () => void;
  selectedPaymentPreset: string;
  onPaymentPresetChange: (preset: string) => void;
  activeTab: "kakaoTalk" | "kakaoPay";
  currentTimePoint: TimePoint;
  onTimePointChange: (timePoint: TimePoint) => void;
  payments: Payment[];
}

export function ContextSimulator({
  chatMessages,
  onSendMessage,
  onClearChat,
  activeTab,
  currentTimePoint,
  onTimePointChange,
  payments,
}: ContextSimulatorProps) {
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSend = useCallback(() => {
    if (!inputValue.trim() || isSending || isComposing) return;
    setIsSending(true);
    const message = inputValue.trim();
    setInputValue("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    onSendMessage(message);
    setTimeout(() => setIsSending(false), 100);
  }, [inputValue, isSending, isComposing, onSendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleSend();
  };

  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  const handleCompositionEnd = (
    e: React.CompositionEvent<HTMLInputElement>
  ) => {
    setIsComposing(false);
    setInputValue(e.currentTarget.value);
  };

  const timePoints: TimePoint[] = ["A", "B", "C"];

  return (
    <div className="w-[375px] h-[812px] bg-white flex flex-col rounded-[40px] shadow-lg overflow-hidden border-[6px] border-[#191919] relative">
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#191919] rounded-b-2xl z-20" />

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
            <div className="bg-[#FEE500] pt-10 pb-4 px-5 shrink-0">
              <h2 className="text-lg font-bold text-[#191919] text-center">
                채팅
              </h2>
              <p className="text-sm text-[#555555] text-center mt-1">
                친구와 대화해보세요
              </p>
            </div>

            {/* Chat Header with Clear Button */}
            <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-[#E5E5E5] shrink-0">
              <button
                onClick={onClearChat}
                className="text-sm text-[#767676] hover:text-[#191919] hover:bg-[#F7F7F7] active:bg-[#E5E5E5] flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                비우기
              </button>
            </div>

            {/* Chat Messages */}
            <div
              ref={scrollContainerRef}
              className="flex-1 p-4 bg-[#F7F7F7] overflow-y-auto"
              style={{ height: "calc(100% - 180px)" }}
            >
              <div className="space-y-3">
                {chatMessages.length === 0 ? (
                  <div className="flex items-center justify-center text-[#767676] py-20">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#FEE500]/30 flex items-center justify-center">
                        <span className="text-2xl">💬</span>
                      </div>
                      <p className="text-base font-medium text-[#555555]">
                        대화를 시작해보세요
                      </p>
                      <p className="text-sm mt-1 text-[#999999]">
                        여행, 맛집 등 관심사를 얘기해보세요
                      </p>
                    </div>
                  </div>
                ) : (
                  chatMessages.map((msg, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${
                        msg.sender === "me" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[75%] px-4 py-2.5 rounded-2xl shadow-sm ${
                          msg.sender === "me"
                            ? "bg-[#FEE500] text-[#191919]"
                            : "bg-white text-[#191919] border border-[#E5E5E5]"
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{msg.message}</p>
                        <p className="text-xs mt-1 opacity-60">{msg.time}</p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-[#E5E5E5] bg-white shrink-0">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onCompositionStart={handleCompositionStart}
                  onCompositionEnd={handleCompositionEnd}
                  placeholder="메시지를 입력하세요"
                  className="flex-1 bg-[#F7F7F7] border-[#E5E5E5] rounded-xl text-sm h-11 focus:border-[#FEE500] focus:ring-[#FEE500]"
                />
                <Button
                  onClick={handleButtonClick}
                  disabled={isSending}
                  size="icon"
                  className="w-11 h-11 bg-[#FEE500] text-[#191919] hover:bg-[#FAE100] rounded-xl transition-colors"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Home Indicator */}
            <div className="h-8 bg-white flex items-center justify-center shrink-0">
              <div className="w-32 h-1 bg-[#191919] rounded-full" />
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
            <div className="bg-[#FEE500] pt-10 pb-4 px-5 shrink-0">
              <h2 className="text-lg font-bold text-[#191919] text-center">
                카카오페이
              </h2>
              <p className="text-sm text-[#555555] text-center mt-1">
                결제 내역
              </p>
            </div>

            {/* 시점 선택 버튼 */}
            <div className="px-5 py-4 border-b border-[#E5E5E5] bg-white shrink-0">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-[#767676]">시점 선택</span>
                <span className="text-xs text-[#999999]">
                  {TIME_POINT_LABELS[currentTimePoint].period}
                </span>
              </div>
              <div className="flex gap-2">
                {timePoints.map((point) => (
                  <button
                    key={point}
                    onClick={() => onTimePointChange(point)}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${
                      currentTimePoint === point
                        ? "bg-[#FEE500] text-[#191919] shadow-sm"
                        : "bg-[#F7F7F7] text-[#767676] hover:bg-[#E5E5E5] active:bg-[#D4D4D4]"
                    }`}
                  >
                    <div className="text-center">
                      <span className="block font-bold">{point}</span>
                      <span className="block text-[10px] opacity-70">
                        {TIME_POINT_LABELS[point].period}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Payment List */}
            <div className="flex-1 p-5 overflow-y-auto bg-[#F7F7F7]">
              <div className="space-y-3">
                {payments.map((payment, idx) => (
                  <motion.div
                    key={`${currentTimePoint}-${idx}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-[#E5E5E5]"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#191919]">
                        {payment.merchant}
                      </p>
                      <p className="text-xs text-[#999999] mt-0.5">
                        {payment.date} · {payment.category}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-[#191919]">
                      {payment.amount}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Home Indicator */}
            <div className="h-8 bg-white flex items-center justify-center shrink-0 border-t border-[#E5E5E5]">
              <div className="w-32 h-1 bg-[#191919] rounded-full" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
