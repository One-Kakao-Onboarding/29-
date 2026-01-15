"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { X, RefreshCw, TrendingUp, TrendingDown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts"
import type { AnnualReportResponse } from "@/services/types"
import type { Payment, TimePoint } from "@/app/page"
import { TIME_POINT_LABELS } from "@/app/page"

interface ConsumptionReportProps {
  onClose: () => void
  onRebuild: () => void
  reportData?: AnnualReportResponse | null
  isLoading?: boolean
  payments?: Payment[]
  previousPayments?: Payment[] | null
  currentTimePoint?: TimePoint
}

// Consumer type mapping
const typeMap: Record<string, { code: string; name: string; description: string }> = {
  마트: { code: "HOME", name: "홈라이프 소비자", description: "집에서 보내는 시간이 늘어난 실속파 소비 패턴" },
  배달: { code: "FAST", name: "효율형 소비자", description: "시간을 아끼는 스마트한 소비 패턴" },
  카페: { code: "CAFE", name: "커피러버 소비자", description: "일상에서 작은 여유를 즐기는 소비 패턴" },
  쇼핑: { code: "SHOP", name: "트렌드 소비자", description: "패션과 라이프스타일에 관심 많은 소비 패턴" },
  OTT: { code: "PLAY", name: "엔터테이너 소비자", description: "콘텐츠와 여가를 즐기는 소비 패턴" },
  공항: { code: "TRIP", name: "여행러 소비자", description: "새로운 경험을 추구하는 활동적인 소비 패턴" },
  교통: { code: "MOVE", name: "액티브 소비자", description: "이동이 많고 활동적인 라이프스타일" },
  편의점: { code: "CONV", name: "편의형 소비자", description: "간편하고 빠른 것을 선호하는 소비 패턴" },
  주유: { code: "DRIV", name: "드라이버 소비자", description: "자동차 중심의 생활을 하는 소비 패턴" },
  영화관: { code: "CINE", name: "시네필 소비자", description: "문화생활을 즐기는 소비 패턴" },
}

/**
 * Calculate category totals from payments
 */
function calculateCategoryTotals(payments: Payment[]) {
  const categoryTotals: Record<string, number> = {}
  let totalAmount = 0

  for (const payment of payments) {
    const amount = parseInt(payment.amount.replace(/[^0-9]/g, ''), 10) || 0
    totalAmount += amount
    categoryTotals[payment.category] = (categoryTotals[payment.category] || 0) + amount
  }

  return { categoryTotals, totalAmount }
}

/**
 * Generate report data from KakaoPay payments with comparison to previous period
 */
function generateReportFromPayments(
  currentPayments: Payment[],
  previousPayments?: Payment[] | null
) {
  // Calculate current period
  const { categoryTotals: currentTotals, totalAmount: currentTotal } = calculateCategoryTotals(currentPayments)

  // Calculate previous period (if available)
  const { categoryTotals: previousTotals, totalAmount: previousTotal } = previousPayments
    ? calculateCategoryTotals(previousPayments)
    : { categoryTotals: {}, totalAmount: 0 }

  // Get all categories from both periods
  const allCategories = new Set([
    ...Object.keys(currentTotals),
    ...Object.keys(previousTotals),
  ])

  // Sort categories by current amount
  const sortedCategories = Array.from(allCategories)
    .map((category) => ({
      category,
      currentAmount: currentTotals[category] || 0,
      previousAmount: previousTotals[category] || 0,
      currentPercentage: currentTotal > 0 ? Math.round(((currentTotals[category] || 0) / currentTotal) * 100) : 0,
      previousPercentage: previousTotal > 0 ? Math.round(((previousTotals[category] || 0) / previousTotal) * 100) : 0,
    }))
    .sort((a, b) => b.currentAmount - a.currentAmount)

  // Generate radar data comparing current vs previous
  const radarData = sortedCategories.map(({ category, currentPercentage, previousPercentage }) => ({
    category,
    old: previousPayments ? previousPercentage : Math.max(10, Math.floor(Math.random() * 30) + 10),
    new: currentPercentage,
  }))

  // Generate changes comparing current vs previous
  const changes = sortedCategories
    .map(({ category, currentAmount, previousAmount }) => {
      const change = currentAmount - previousAmount
      return {
        category,
        change: Math.abs(change),
        direction: change >= 0 ? ("up" as const) : ("down" as const),
        rawChange: change,
      }
    })
    .filter((c) => c.change > 0)
    .sort((a, b) => Math.abs(b.rawChange) - Math.abs(a.rawChange))
    .slice(0, 4)

  // Determine consumer type from top category
  const topCategory = sortedCategories[0]?.category || "카페"
  const type = typeMap[topCategory] || typeMap["카페"]

  // Calculate estimated savings (10% of total)
  const totalSavings = Math.round(currentTotal * 0.1)

  return {
    radarData,
    changes,
    type,
    totalSavings,
  }
}

// Fallback mock data for demo mode (when no payments provided)
const mockReportData = {
  radarData: [
    { category: "마트", old: 25, new: 65 },
    { category: "배달", old: 45, new: 75 },
    { category: "카페", old: 70, new: 40 },
    { category: "쇼핑", old: 65, new: 55 },
    { category: "편의점", old: 30, new: 60 },
    { category: "OTT", old: 50, new: 45 },
  ],
  changes: [
    { category: "마트", change: 250000, direction: "up" as const },
    { category: "배달", change: 180000, direction: "up" as const },
    { category: "편의점", change: 120000, direction: "up" as const },
    { category: "카페", change: -85000, direction: "down" as const },
  ],
  type: {
    code: "HOME",
    name: "홈라이프 소비자",
    description: "집에서 보내는 시간이 늘어난 실속파 소비 패턴",
  },
  totalSavings: 156000,
}

/**
 * Transform API response to chart-compatible format
 */
function transformApiData(reportData: AnnualReportResponse) {
  const { past_pattern, new_pattern } = reportData.category_breakdown

  // Merge categories from both patterns
  const categorySet = new Set([
    ...past_pattern.map((p) => p.category),
    ...new_pattern.map((p) => p.category),
  ])

  const radarData = Array.from(categorySet).map((category) => {
    const oldData = past_pattern.find((p) => p.category === category)
    const newData = new_pattern.find((p) => p.category === category)
    return {
      category,
      old: oldData?.percentage || 0,
      new: newData?.percentage || 0,
    }
  })

  // Calculate changes
  const changes = Array.from(categorySet)
    .map((category) => {
      const oldData = past_pattern.find((p) => p.category === category)
      const newData = new_pattern.find((p) => p.category === category)
      const oldAmount = oldData?.amount || 0
      const newAmount = newData?.amount || 0
      const change = newAmount - oldAmount
      return {
        category,
        change: Math.abs(change),
        direction: change >= 0 ? ("up" as const) : ("down" as const),
        rawChange: change,
      }
    })
    .filter((c) => c.rawChange !== 0)
    .sort((a, b) => Math.abs(b.rawChange) - Math.abs(a.rawChange))
    .slice(0, 4)

  // Determine consumer type based on top categories
  const topNewCategory = new_pattern[0]?.category || "카페"
  const typeMap: Record<string, { code: string; name: string; description: string }> = {
    마트: { code: "HOME", name: "홈라이프 소비자", description: "집에서 보내는 시간이 늘어난 실속파 소비 패턴" },
    배달: { code: "FAST", name: "효율형 소비자", description: "시간을 아끼는 스마트한 소비 패턴" },
    카페: { code: "CAFE", name: "커피러버 소비자", description: "일상에서 작은 여유를 즐기는 소비 패턴" },
    쇼핑: { code: "SHOP", name: "트렌드 소비자", description: "패션과 라이프스타일에 관심 많은 소비 패턴" },
    OTT: { code: "PLAY", name: "엔터테이너 소비자", description: "콘텐츠와 여가를 즐기는 소비 패턴" },
    공항: { code: "TRIP", name: "여행러 소비자", description: "새로운 경험을 추구하는 활동적인 소비 패턴" },
    교통: { code: "MOVE", name: "액티브 소비자", description: "이동이 많고 활동적인 라이프스타일" },
    편의점: { code: "CONV", name: "편의형 소비자", description: "간편하고 빠른 것을 선호하는 소비 패턴" },
    주유: { code: "DRIV", name: "드라이버 소비자", description: "자동차 중심의 생활을 하는 소비 패턴" },
    영화관: { code: "CINE", name: "시네필 소비자", description: "문화생활을 즐기는 소비 패턴" },
  }
  const type = typeMap[topNewCategory] || mockReportData.type

  return {
    radarData,
    changes,
    type,
    totalSavings: reportData.total_savings_achieved,
  }
}

export function ConsumptionReport({
  onClose,
  onRebuild,
  reportData,
  isLoading,
  payments,
  previousPayments,
  currentTimePoint,
}: ConsumptionReportProps) {
  // Transform API data, generate from payments, or use mock data
  const { radarData, changes, type, totalSavings } = useMemo(() => {
    if (reportData) {
      return transformApiData(reportData)
    }
    // Use KakaoPay payments data if available
    if (payments && payments.length > 0) {
      return generateReportFromPayments(payments, previousPayments)
    }
    return mockReportData
  }, [reportData, payments, previousPayments])

  // Get time point labels for display
  const currentPeriod = currentTimePoint ? TIME_POINT_LABELS[currentTimePoint].period : "현재"
  const previousTimePoint: TimePoint | null = currentTimePoint === "A" ? null : currentTimePoint === "B" ? "A" : "B"
  const previousPeriod = previousTimePoint ? TIME_POINT_LABELS[previousTimePoint].period : "이전"

  // Loading state
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="h-full flex items-center justify-center"
      >
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">리포트를 불러오는 중...</p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">소비 패턴 리포트</h3>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Consumer Type Badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center"
      >
        <span className="text-white/60 font-bold text-3xl tracking-widest">{type.code}</span>
        <p className="text-white font-medium mt-2">{type.name}</p>
        <p className="text-gray-400 text-xs mt-1">{type.description}</p>
      </motion.div>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2"
      >
        <p className="text-gray-300 text-sm leading-relaxed">
          홍길동님, {previousPeriod}과 비교해봤어요.
          <br />
          <span className="text-white font-medium">라이프스타일이 완전히 바뀌었네요!</span>
        </p>
        <div className="text-xs text-gray-400 space-y-1">
          {changes.slice(0, 4).map((item, idx) => (
            <p key={idx}>
              • {item.category}에서{" "}
              <span className="text-white font-medium">{item.change.toLocaleString()}원</span>{" "}
              {item.direction === "up" ? "더" : "적게"} 썼어요
            </p>
          ))}
        </div>
        {totalSavings > 0 && (
          <p className="text-purple-400 text-xs mt-2">
            지금까지 약 <span className="font-bold">{totalSavings.toLocaleString()}원</span> 절약했어요!
          </p>
        )}
      </motion.div>

      {/* Radar Chart */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="h-[160px] -mx-2"
      >
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData}>
            <PolarGrid stroke="#ffffff15" />
            <PolarAngleAxis dataKey="category" tick={{ fill: "#9ca3af", fontSize: 9 }} />
            <Radar name={previousPeriod} dataKey="old" stroke="#6b7280" fill="#6b7280" fillOpacity={0.2} strokeWidth={2} />
            <Radar name={currentPeriod} dataKey="new" stroke="#ffffff" fill="#ffffff" fillOpacity={0.2} strokeWidth={2} />
          </RadarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Legend */}
      <div className="flex justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-500" />
          <span className="text-gray-400">{previousPeriod}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-white" />
          <span className="text-gray-400">{currentPeriod}</span>
        </div>
      </div>

      {/* Changes List */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-2"
      >
        <p className="text-xs text-gray-500 px-1">주요 변화</p>
        {changes.slice(0, 4).map((item, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-3 py-2"
          >
            <span className="text-gray-300 text-sm">{item.category}</span>
            <div className="flex items-center gap-1 text-white">
              {item.direction === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span className="text-sm font-medium">
                {item.direction === "up" ? "+" : "-"}
                {item.change.toLocaleString()}원
              </span>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Rebuild Button */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Button
          onClick={onRebuild}
          className="w-full py-5 bg-purple-600 text-white font-bold text-sm hover:bg-purple-700 rounded-xl"
        >
          <RefreshCw className="w-4 h-4 mr-2" />새 라이프스타일에 맞춰 혜택 바꾸기
        </Button>
      </motion.div>
    </motion.div>
  )
}
