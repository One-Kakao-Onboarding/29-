"use client"

import { useState, useEffect } from "react"
import { ContextSimulator } from "@/components/context-simulator"
import { OrottService } from "@/components/oroft-service"
import { Sparkles, FastForward } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
  analyzeAndRecommend,
  getAnnualReport,
  sendChatMessage,
  getChatHistory,
  transformToBenefit,
  isApiConfigured,
  TEST_USER_ID,
} from "@/services/api"
import type { AnnualReportResponse, RecommendedBenefit } from "@/services/types"

/**
 * ============================================================================
 * [원장 데이터] 카테고리 및 브랜드 목록 - 절대 변경 금지!
 * ============================================================================
 *
 * 이 카테고리는 card-3d.tsx의 CATEGORY_COLORS와 동기화되어야 합니다.
 * AI가 혜택을 추천할 때 반드시 아래 카테고리 중 하나를 사용해야 합니다.
 *
 * 카페     : 스타벅스, 할리스, 투썸
 * 영화관   : CGV, 메가박스, 롯데시네마
 * 배달     : 배달의민족, 쿠팡잇츠
 * OTT      : 넷플릭스, 디즈니+, 티빙, 웨이브
 * 교통     : 시내버스, 시외버스, 지하철
 * 편의점   : CU, GS25, 세븐일레븐, emart everyday
 * 주유     : S-oil, 현대오일뱅크, SK
 * 쇼핑     : 무신사, 지그재그, 8-seconds, W컨셉, 29cm
 * 공항     : 공항라운지, 대한항공, 아시아나, 진에어
 * 마트     : 이마트, 롯데마트
 *
 * [주의] 위 10개 카테고리 외에는 사용할 수 없습니다!
 * 새로운 브랜드가 추가되면 기존 카테고리에 매핑해야 합니다.
 *
 * ============================================================================
 */

export type AnalysisState = "idle" | "loading" | "complete"

export interface ChatMessage {
  sender: "me" | "ai"
  message: string
  time: string
}

export interface Payment {
  merchant: string
  amount: string
  date: string
  category: string
}

export interface Benefit {
  id: string
  title: string
  discount: string
  icon: string
  reason: string
  reasonIcon: string
  category: string
  color: string
}

export const paymentPresets: Record<string, Payment[]> = {
  travel: [
    { merchant: "대한항공", amount: "350,000원", date: "3/10", category: "공항" },
    { merchant: "지하철", amount: "2,800원", date: "3/8", category: "교통" },
    { merchant: "스타벅스 공항점", amount: "6,500원", date: "3/7", category: "카페" },
    { merchant: "공항라운지", amount: "45,000원", date: "3/7", category: "공항" },
  ],
  parenting: [
    { merchant: "이마트", amount: "85,000원", date: "3/10", category: "마트" },
    { merchant: "롯데마트", amount: "45,000원", date: "3/8", category: "마트" },
    { merchant: "무신사", amount: "78,000원", date: "3/5", category: "쇼핑" },
    { merchant: "배달의민족", amount: "32,000원", date: "3/3", category: "배달" },
  ],
  daily: [
    { merchant: "스타벅스 강남점", amount: "6,500원", date: "3/12", category: "카페" },
    { merchant: "넷플릭스", amount: "17,000원", date: "3/1", category: "OTT" },
    { merchant: "배달의민족", amount: "25,000원", date: "2/28", category: "배달" },
    { merchant: "GS25", amount: "8,200원", date: "2/27", category: "편의점" },
  ],
  shopping: [
    { merchant: "무신사", amount: "89,000원", date: "3/11", category: "쇼핑" },
    { merchant: "29cm", amount: "65,000원", date: "3/9", category: "쇼핑" },
    { merchant: "지그재그", amount: "47,000원", date: "3/6", category: "쇼핑" },
    { merchant: "CGV", amount: "28,000원", date: "3/2", category: "영화관" },
  ],
}

// Fallback benefits for demo mode (when API is not configured)
const fallbackBenefits: Benefit[] = [
  {
    id: "1",
    title: "스타벅스",
    discount: "10% 캐시백",
    icon: "☕",
    reason: "이번 달 카페에서 32,000원 사용했어요",
    reasonIcon: "💳",
    category: "카페",
    color: "#22c55e",
  },
  {
    id: "2",
    title: "배달의민족",
    discount: "3,000원 할인",
    icon: "🛵",
    reason: "최근 배달 이용이 잦아졌어요",
    reasonIcon: "📊",
    category: "배달",
    color: "#eab308",
  },
  {
    id: "3",
    title: "넷플릭스",
    discount: "1개월 무료",
    icon: "🎬",
    reason: "결제일(15일)이 곧 다가와요",
    reasonIcon: "📅",
    category: "OTT",
    color: "#ef4444",
  },
]

const fallbackAlternatives: Benefit[] = [
  {
    id: "alt1",
    title: "GS25",
    discount: "20% 캐시백",
    icon: "🏪",
    reason: "편의점 자주 가시네요",
    reasonIcon: "💳",
    category: "편의점",
    color: "#a855f7",
  },
  {
    id: "alt2",
    title: "CGV",
    discount: "50% 할인",
    icon: "🎥",
    reason: "주말 여가 활동이 많아요",
    reasonIcon: "📅",
    category: "영화관",
    color: "#f97316",
  },
  {
    id: "alt3",
    title: "지하철",
    discount: "10% 할인",
    icon: "🚇",
    reason: "출퇴근 교통비를 아껴드릴게요",
    reasonIcon: "📊",
    category: "교통",
    color: "#3b82f6",
  },
  {
    id: "alt4",
    title: "이마트",
    discount: "10% 할인",
    icon: "🛒",
    reason: "마트 이용이 늘고 있어요",
    reasonIcon: "📊",
    category: "마트",
    color: "#a16207",
  },
]

export default function Home() {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [selectedPaymentPreset, setSelectedPaymentPreset] = useState<string>("daily")
  const [analysisState, setAnalysisState] = useState<AnalysisState>("idle")
  const [benefits, setBenefits] = useState<Benefit[]>([])
  const [alternativeBenefits, setAlternativeBenefits] = useState<Benefit[]>(fallbackAlternatives)
  const [showReport, setShowReport] = useState(false)
  const [activeSimulatorTab, setActiveSimulatorTab] = useState<"kakaoTalk" | "kakaoPay">("kakaoTalk")
  const [reportData, setReportData] = useState<AnnualReportResponse | null>(null)
  const [isReportLoading, setIsReportLoading] = useState(false)

  // Chat room ID - persisted in localStorage to maintain chat history across page reloads
  const [chatRoomId, setChatRoomId] = useState<string>("")
  const [isSending, setIsSending] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)

  // Store benefit_option_id mapping for API confirmation
  const [benefitOptionMap, setBenefitOptionMap] = useState<Map<string, RecommendedBenefit>>(new Map())

  // Initialize chatRoomId from localStorage on client mount
  useEffect(() => {
    const stored = localStorage.getItem("orott_chat_room_id")
    if (stored) {
      setChatRoomId(stored)
    } else {
      const newId = crypto.randomUUID()
      localStorage.setItem("orott_chat_room_id", newId)
      setChatRoomId(newId)
    }
  }, [])

  // Load chat history after chatRoomId is set
  useEffect(() => {
    if (!chatRoomId || !isApiConfigured()) {
      setIsLoadingHistory(false)
      return
    }

    const loadChatHistory = async () => {
      try {
        const response = await getChatHistory({
          user_id: TEST_USER_ID,
          chat_room_id: chatRoomId,
          limit: 50,
        })

        if (response.messages.length > 0) {
          const loadedMessages: ChatMessage[] = response.messages.map((msg) => ({
            sender: msg.sender,
            message: msg.message,
            time: msg.time,
          }))
          setChatMessages(loadedMessages)
        }
      } catch (error) {
        // Silently fail - chat history is optional
        console.log("No previous chat history found")
      } finally {
        setIsLoadingHistory(false)
      }
    }

    loadChatHistory()
  }, [chatRoomId])

  /**
   * Analyze spending patterns and get AI recommendations
   * Falls back to demo data if API is not configured
   */
  const handleAnalyze = async () => {
    setAnalysisState("loading")

    // Check if API is configured
    if (!isApiConfigured()) {
      // Demo mode - use fallback data
      setTimeout(() => {
        setBenefits(fallbackBenefits)
        setAlternativeBenefits(fallbackAlternatives)
        setAnalysisState("complete")
        toast.info("데모 모드로 실행 중입니다. .env.local 파일을 설정하면 실제 AI 분석을 사용할 수 있습니다.")
      }, 1500)
      return
    }

    try {
      const response = await analyzeAndRecommend({
        user_id: TEST_USER_ID,
        chat_room_id: chatRoomId,
        analysis_period_months: 12,
      })

      // Transform recommended benefits to frontend format
      const recommendedBenefits = response.recommended_benefits.slice(0, 3)
      const transformedBenefits = recommendedBenefits.map(transformToBenefit)

      // Store mapping for later confirmation
      const mapping = new Map<string, RecommendedBenefit>()
      recommendedBenefits.forEach((rec) => {
        mapping.set(rec.benefit_option_id, rec)
      })
      setBenefitOptionMap(mapping)

      // Remaining benefits become alternatives
      const remainingBenefits = response.recommended_benefits.slice(3)
      const transformedAlternatives = remainingBenefits.map(transformToBenefit)

      setBenefits(transformedBenefits)
      setAlternativeBenefits(transformedAlternatives.length > 0 ? transformedAlternatives : fallbackAlternatives)
      setAnalysisState("complete")

      // Show savings info
      const savings = response.comparison.expected_monthly_savings
      if (savings.improvement > 0) {
        toast.success(`월 ${savings.improvement.toLocaleString()}원 더 절약할 수 있어요!`)
      }
    } catch (error) {
      console.error("Analysis failed:", error)
      setAnalysisState("idle")

      // Show error and offer demo mode
      toast.error(error instanceof Error ? error.message : "분석 중 오류가 발생했습니다", {
        action: {
          label: "데모 모드로 보기",
          onClick: () => {
            setAnalysisState("loading")
            setTimeout(() => {
              setBenefits(fallbackBenefits)
              setAlternativeBenefits(fallbackAlternatives)
              setAnalysisState("complete")
            }, 500)
          },
        },
      })
    }
  }

  /**
   * Handle chat message - calls AI API and saves to database
   */
  const handleSendMessage = async (message: string) => {
    if (isSending || !chatRoomId) return

    const now = new Date()
    const timeStr = `${now.getHours() > 12 ? "오후" : "오전"} ${now.getHours() % 12 || 12}:${String(now.getMinutes()).padStart(2, "0")}`

    // Add user message immediately
    const userMsg: ChatMessage = { sender: "me", message, time: timeStr }
    setChatMessages((prev) => [...prev, userMsg])

    // If API is not configured, use fallback mock responses
    if (!isApiConfigured()) {
      setTimeout(() => {
        const aiResponses = [
          "오 그렇구나! 더 얘기해줘",
          "재밌겠다~ 나도 가고 싶어",
          "ㅋㅋㅋ 진짜? 대박",
          "응응 그래서 어떻게 됐어?",
          "좋은 생각이야!",
          "아 그래? 나도 비슷해~",
        ]
        const aiMsg: ChatMessage = {
          sender: "ai",
          message: aiResponses[Math.floor(Math.random() * aiResponses.length)],
          time: timeStr,
        }
        setChatMessages((prev) => [...prev, aiMsg])
      }, 800)
      return
    }

    // Call AI API
    setIsSending(true)
    try {
      const response = await sendChatMessage({
        user_id: TEST_USER_ID,
        chat_room_id: chatRoomId,
        message: message,
      })

      const aiMsg: ChatMessage = {
        sender: "ai",
        message: response.ai_response,
        time: timeStr,
      }
      setChatMessages((prev) => [...prev, aiMsg])
    } catch (error) {
      console.error("Chat failed:", error)
      // Fallback to a generic response on error
      const aiMsg: ChatMessage = {
        sender: "ai",
        message: "앗 잠깐 끊겼어! 다시 말해줄래?",
        time: timeStr,
      }
      setChatMessages((prev) => [...prev, aiMsg])
    } finally {
      setIsSending(false)
    }
  }

  const handleClearChat = () => {
    setChatMessages([])
    // Generate new chat room ID for fresh conversation
    const newId = crypto.randomUUID()
    localStorage.setItem("orott_chat_room_id", newId)
    setChatRoomId(newId)
  }

  const handleSwapBenefit = (id: string, newBenefit: Benefit) => {
    setBenefits((prev) => prev.map((b) => (b.id === id ? newBenefit : b)))
    toast.success("혜택이 변경되었습니다")
  }

  /**
   * Load annual report data
   */
  const handleShowReport = async () => {
    setShowReport(true)
    setIsReportLoading(true)

    if (!isApiConfigured()) {
      // Demo mode - report component will use mock data
      setTimeout(() => {
        setIsReportLoading(false)
      }, 500)
      return
    }

    try {
      const report = await getAnnualReport({
        user_id: TEST_USER_ID,
      })
      setReportData(report)
    } catch (error) {
      console.error("Failed to load report:", error)
      toast.error("리포트를 불러오는데 실패했습니다")
    } finally {
      setIsReportLoading(false)
    }
  }

  /**
   * Rebuild benefits based on lifestyle changes
   */
  const handleRebuild = async () => {
    setShowReport(false)
    setAnalysisState("loading")

    if (!isApiConfigured()) {
      // Demo mode
      setTimeout(() => {
        setBenefits([
          {
            id: "1",
            title: "이마트",
            discount: "10% 할인",
            icon: "🛒",
            reason: "마트 이용이 급증했어요",
            reasonIcon: "📊",
            category: "마트",
            color: "#a16207",
          },
          {
            id: "2",
            title: "배달의민족",
            discount: "5,000원 할인",
            icon: "🛵",
            reason: "배달 주문이 작년보다 3배 늘었어요",
            reasonIcon: "📊",
            category: "배달",
            color: "#eab308",
          },
          {
            id: "3",
            title: "GS25",
            discount: "20% 캐시백",
            icon: "🏪",
            reason: "편의점 방문이 크게 늘었어요",
            reasonIcon: "💳",
            category: "편의점",
            color: "#a855f7",
          },
        ])
        setAnalysisState("complete")
        toast.success("새로운 라이프스타일에 맞춰 혜택을 재구성했어요!")
      }, 1500)
      return
    }

    try {
      // Re-analyze with fresh data
      const response = await analyzeAndRecommend({
        user_id: TEST_USER_ID,
        chat_room_id: chatRoomId,
        analysis_period_months: 3, // Focus on recent 3 months for lifestyle change
      })

      const recommendedBenefits = response.recommended_benefits.slice(0, 3)
      const transformedBenefits = recommendedBenefits.map(transformToBenefit)

      const remainingBenefits = response.recommended_benefits.slice(3)
      const transformedAlternatives = remainingBenefits.map(transformToBenefit)

      setBenefits(transformedBenefits)
      setAlternativeBenefits(transformedAlternatives.length > 0 ? transformedAlternatives : fallbackAlternatives)
      setAnalysisState("complete")

      toast.success("새로운 라이프스타일에 맞춰 혜택을 재구성했어요!")
    } catch (error) {
      console.error("Rebuild failed:", error)
      setAnalysisState("complete") // Keep showing previous benefits
      toast.error("혜택 재구성 중 오류가 발생했습니다")
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col items-center justify-center gap-6 p-8">
      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          <Button
            onClick={() => setActiveSimulatorTab("kakaoTalk")}
            variant={activeSimulatorTab === "kakaoTalk" ? "default" : "outline"}
            className={`${activeSimulatorTab === "kakaoTalk" ? "bg-[#fee500] text-gray-900 hover:bg-[#fdd835]" : "bg-white text-gray-700 hover:bg-gray-50"}`}
          >
            카카오톡
          </Button>
          <Button
            onClick={() => setActiveSimulatorTab("kakaoPay")}
            variant={activeSimulatorTab === "kakaoPay" ? "default" : "outline"}
            className={`${activeSimulatorTab === "kakaoPay" ? "bg-[#fee500] text-gray-900 hover:bg-[#fdd835]" : "bg-white text-gray-700 hover:bg-gray-50"}`}
          >
            카카오페이
          </Button>
        </div>

        <Button
          onClick={handleAnalyze}
          disabled={analysisState === "loading"}
          className="px-6 py-2 bg-purple-600 text-white font-bold hover:bg-purple-700 disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          AI로 분석하고 혜택 추천받기
        </Button>

        {analysisState === "complete" && !showReport && (
          <Button
            onClick={handleShowReport}
            variant="outline"
            className="px-4 py-2 bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <FastForward className="w-4 h-4 mr-2" />
            (Demo) 1년 뒤 라이프스타일 변화
          </Button>
        )}
      </div>

      <div className="flex items-center gap-8">
        <ContextSimulator
          chatMessages={chatMessages}
          onSendMessage={handleSendMessage}
          onClearChat={handleClearChat}
          selectedPaymentPreset={selectedPaymentPreset}
          onPaymentPresetChange={setSelectedPaymentPreset}
          activeTab={activeSimulatorTab}
        />
        <OrottService
          analysisState={analysisState}
          benefits={benefits}
          alternativeBenefits={alternativeBenefits}
          onSwapBenefit={handleSwapBenefit}
          showReport={showReport}
          onCloseReport={() => setShowReport(false)}
          onRebuild={handleRebuild}
          payments={paymentPresets[selectedPaymentPreset]}
          reportData={reportData}
          isReportLoading={isReportLoading}
        />
      </div>
    </main>
  )
}
