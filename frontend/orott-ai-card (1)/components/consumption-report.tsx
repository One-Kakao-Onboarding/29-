"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { X, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import type { AnnualReportResponse } from "@/services/types";
import type { Payment, TimePoint } from "@/app/page";
import { TIME_POINT_LABELS } from "@/app/page";

interface ConsumptionReportProps {
  onClose: () => void;
  onRebuild: () => void;
  reportData?: AnnualReportResponse | null;
  isLoading?: boolean;
  payments?: Payment[];
  previousPayments?: Payment[] | null;
  currentTimePoint?: TimePoint;
  userName?: string;
}

// Consumer type mapping - 친근하고 위트있는 라이프스타일 유형
const typeMap: Record<string, { name: string; description: string; emoji: string }> = {
  마트: { name: "살림 고수", description: "알뜰하게 장보는 현명한 소비자", emoji: "🛒" },
  배달: { name: "집콕 미식가", description: "맛있는 건 배달로! 집에서 즐기는 미식", emoji: "🍕" },
  카페: { name: "카페 단골손님", description: "커피 한 잔의 여유를 아는 사람", emoji: "☕" },
  쇼핑: { name: "패션 피플", description: "트렌드를 읽고 스타일을 완성하는", emoji: "👗" },
  OTT: { name: "집순이 소비자", description: "이동이 적고 콘텐츠를 즐기는 라이프스타일", emoji: "📺" },
  공항: { name: "여행 덕후", description: "새로운 곳을 탐험하는 게 행복인 사람", emoji: "✈️" },
  교통: { name: "바쁜 일상러", description: "이동이 많은 활동적인 라이프스타일", emoji: "🚇" },
  편의점: { name: "편세권 주민", description: "편의점이 곧 내 냉장고인 사람", emoji: "🏪" },
  주유: { name: "도로 위 자유인", description: "차와 함께하는 자유로운 라이프스타일", emoji: "🚗" },
  영화관: { name: "영화관 단골", description: "큰 화면과 팝콘을 사랑하는 시네필", emoji: "🎬" },
};

/**
 * Calculate category totals from payments
 */
function calculateCategoryTotals(payments: Payment[]) {
  const categoryTotals: Record<string, number> = {};
  let totalAmount = 0;

  for (const payment of payments) {
    const amount = parseInt(payment.amount.replace(/[^0-9]/g, ''), 10) || 0;
    totalAmount += amount;
    categoryTotals[payment.category] = (categoryTotals[payment.category] || 0) + amount;
  }

  return { categoryTotals, totalAmount };
}

/**
 * Generate report data from KakaoPay payments with comparison to previous period
 */
function generateReportFromPayments(
  currentPayments: Payment[],
  previousPayments?: Payment[] | null
) {
  // Calculate current period
  const { categoryTotals: currentTotals, totalAmount: currentTotal } = calculateCategoryTotals(currentPayments);

  // Calculate previous period (if available)
  const { categoryTotals: previousTotals, totalAmount: previousTotal } = previousPayments
    ? calculateCategoryTotals(previousPayments)
    : { categoryTotals: {}, totalAmount: 0 };

  // Get all categories from both periods
  const allCategories = new Set([
    ...Object.keys(currentTotals),
    ...Object.keys(previousTotals),
  ]);

  // Sort categories by current amount
  const sortedCategories = Array.from(allCategories)
    .map((category) => ({
      category,
      currentAmount: currentTotals[category] || 0,
      previousAmount: previousTotals[category] || 0,
      currentPercentage: currentTotal > 0 ? Math.round(((currentTotals[category] || 0) / currentTotal) * 100) : 0,
      previousPercentage: previousTotal > 0 ? Math.round(((previousTotals[category] || 0) / previousTotal) * 100) : 0,
    }))
    .sort((a, b) => b.currentAmount - a.currentAmount);

  // Generate radar data comparing current vs previous
  const radarData = sortedCategories.map(({ category, currentPercentage, previousPercentage }) => ({
    category,
    old: previousPayments ? previousPercentage : Math.max(10, Math.floor(Math.random() * 30) + 10),
    new: currentPercentage,
  }));

  // Generate changes comparing current vs previous
  const changes = sortedCategories
    .map(({ category, currentAmount, previousAmount }) => {
      const change = currentAmount - previousAmount;
      return {
        category,
        change: Math.abs(change),
        direction: change >= 0 ? ("up" as const) : ("down" as const),
        rawChange: change,
      };
    })
    .filter((c) => c.change > 0)
    .sort((a, b) => Math.abs(b.rawChange) - Math.abs(a.rawChange))
    .slice(0, 4);

  // Determine consumer type from top category
  const topCategory = sortedCategories[0]?.category || "카페";
  const type = typeMap[topCategory] || typeMap["카페"] || mockReportData.type;

  // Calculate estimated savings (10% of total)
  const totalSavings = Math.round(currentTotal * 0.1);

  return {
    radarData,
    changes,
    type,
    totalSavings,
  };
}

// Fallback mock data for demo mode (when no payments provided)
// 예시: 이전에는 교통/편의점 중심 → 현재는 OTT/배달/영화관 중심 (집순이 변신)
const mockReportData = {
  radarData: [
    { category: "OTT", old: 20, new: 75 },
    { category: "배달", old: 30, new: 70 },
    { category: "영화관", old: 25, new: 65 },
    { category: "교통", old: 70, new: 25 },
    { category: "편의점", old: 60, new: 30 },
    { category: "카페", old: 55, new: 40 },
  ],
  changes: [
    { category: "OTT", change: 98000, direction: "up" as const },
    { category: "배달", change: 85000, direction: "up" as const },
    { category: "영화관", change: 70000, direction: "up" as const },
    { category: "교통", change: 65000, direction: "down" as const },
  ],
  type: {
    name: "집순이 소비자",
    description: "이동이 적고 콘텐츠를 즐기는 라이프스타일",
    emoji: "📺",
  },
  totalSavings: 156000,
};

/**
 * Transform API response to chart-compatible format
 */
function transformApiData(reportData: AnnualReportResponse) {
  const { past_pattern, new_pattern } = reportData.category_breakdown;

  // Merge categories from both patterns
  const categorySet = new Set([
    ...past_pattern.map((p) => p.category),
    ...new_pattern.map((p) => p.category),
  ]);

  const radarData = Array.from(categorySet).map((category) => {
    const oldData = past_pattern.find((p) => p.category === category);
    const newData = new_pattern.find((p) => p.category === category);
    return {
      category,
      old: oldData?.percentage || 0,
      new: newData?.percentage || 0,
    };
  });

  // Calculate changes
  const changes = Array.from(categorySet)
    .map((category) => {
      const oldData = past_pattern.find((p) => p.category === category);
      const newData = new_pattern.find((p) => p.category === category);
      const oldAmount = oldData?.amount || 0;
      const newAmount = newData?.amount || 0;
      const change = newAmount - oldAmount;
      return {
        category,
        change: Math.abs(change),
        direction: change >= 0 ? ("up" as const) : ("down" as const),
        rawChange: change,
      };
    })
    .filter((c) => c.rawChange !== 0)
    .sort((a, b) => Math.abs(b.rawChange) - Math.abs(a.rawChange))
    .slice(0, 4);

  // Determine consumer type based on top categories
  const topNewCategory = new_pattern[0]?.category || "카페";
  const type = typeMap[topNewCategory] || typeMap["카페"] || mockReportData.type;

  return {
    radarData,
    changes,
    type,
    totalSavings: reportData.total_savings_achieved,
  };
}

export function ConsumptionReport({
  onClose,
  onRebuild,
  reportData,
  isLoading,
  payments,
  previousPayments,
  currentTimePoint,
  userName = "사용자",
}: ConsumptionReportProps) {
  // Transform API data, generate from payments, or use mock data
  const { radarData, changes, type, totalSavings } = useMemo(() => {
    if (reportData) {
      return transformApiData(reportData);
    }
    // Use KakaoPay payments data if available
    if (payments && payments.length > 0) {
      return generateReportFromPayments(payments, previousPayments);
    }
    return mockReportData;
  }, [reportData, payments, previousPayments]);

  // Get time point labels for display
  const currentPeriod = currentTimePoint ? TIME_POINT_LABELS[currentTimePoint].period : "현재";
  const previousTimePoint: TimePoint | null = currentTimePoint === "A" ? null : currentTimePoint === "B" ? "A" : "B";
  const previousPeriod = previousTimePoint ? TIME_POINT_LABELS[previousTimePoint].period : "이전";

  // Loading state
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="h-full flex items-center justify-center py-16"
      >
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-[#FEE500] animate-spin mx-auto mb-4" />
          <p className="text-[#767676] text-sm">리포트를 불러오는 중...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4 pt-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-[#191919]">연간 소비 분석 리포트</h3>
          <p className="text-xs text-[#767676] mt-0.5">카드는 그대로, 혜택은 매년 새롭게</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-[#F7F7F7] active:bg-[#E5E5E5] rounded-xl transition-colors"
        >
          <X className="w-5 h-5 text-[#767676]" />
        </button>
      </div>

      {/* Consumer Type Badge - 라이프스타일 유형 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-[#FEE500]/30 to-[#FEE500]/10 rounded-2xl p-6 text-center border border-[#FEE500]/40"
      >
        <div className="text-5xl mb-3">{type.emoji}</div>
        <p className="text-[#191919] font-bold text-2xl">{type.name}</p>
        <p className="text-[#555555] text-sm mt-2">{type.description}</p>
      </motion.div>

      {/* User greeting */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="text-center py-2"
      >
        <p className="text-[#191919] text-lg">
          <span className="font-bold">{userName}</span>님,
        </p>
      </motion.div>

      {/* Spending Changes - 지출 변화 요약 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl p-4 shadow-sm border border-[#E5E5E5]"
      >
        <div className="space-y-3">
          {changes.slice(0, 3).map((item, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <span className="text-[#191919] text-sm">
                <span className="font-medium">{item.category}</span>에서
              </span>
              <span className={`text-sm font-bold ${
                item.direction === "up" ? "text-[#DC3545]" : "text-[#3182F6]"
              }`}>
                {item.change.toLocaleString()}원 {item.direction === "up" ? "더 썼어요" : "줄었어요"}
              </span>
            </div>
          ))}
        </div>
        {totalSavings > 0 && (
          <div className="mt-4 pt-3 border-t border-[#E5E5E5] flex items-center justify-between bg-[#F8F8F8] -mx-4 -mb-4 px-4 py-3 rounded-b-2xl">
            <p className="text-[#191919] text-sm">
              오롯 혜택으로{" "}
              <span className="font-bold">{totalSavings.toLocaleString()}원</span> 절약
            </p>
            <span className="text-xl">🎉</span>
          </div>
        )}
      </motion.div>

      {/* Radar Chart */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="h-[180px] -mx-2 bg-white rounded-2xl p-2 shadow-sm border border-[#E5E5E5]"
      >
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData}>
            <PolarGrid stroke="#E5E5E5" />
            <PolarAngleAxis
              dataKey="category"
              tick={{ fill: "#767676", fontSize: 11 }}
            />
            <Radar
              name={previousPeriod}
              dataKey="old"
              stroke="#D4D4D4"
              fill="#D4D4D4"
              fillOpacity={0.3}
              strokeWidth={2}
            />
            <Radar
              name={currentPeriod}
              dataKey="new"
              stroke="#FEE500"
              fill="#FEE500"
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Legend */}
      <div className="flex justify-center gap-8 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#D4D4D4]" />
          <span className="text-[#767676]">{previousPeriod} 소비</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#FEE500]" />
          <span className="text-[#767676]">{currentPeriod} 소비</span>
        </div>
      </div>

      {/* Rebuild Button - 원클릭 혜택 업데이트 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="space-y-2"
      >
        <Button
          onClick={onRebuild}
          className="w-full py-6 bg-[#191919] text-white font-semibold text-sm hover:bg-[#333333] rounded-xl transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          원클릭 혜택 리모델링
        </Button>
        <p className="text-center text-xs text-[#999999]">
          카드 재발급 없이 바로 적용
        </p>
      </motion.div>
    </motion.div>
  );
}
