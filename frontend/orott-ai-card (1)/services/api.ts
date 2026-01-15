/**
 * API Client for Supabase Edge Functions
 * Base URL: https://fvlanbsclsewkfypomlr.supabase.co/functions/v1
 */

import type { Benefit } from "@/app/page";
import type {
  AnalyzeRequest,
  AnalyzeResponse,
  ConfirmBenefitsRequest,
  ConfirmBenefitsResponse,
  AnnualReportRequest,
  AnnualReportResponse,
  RecommendedBenefit,
  ChatRequest,
  ChatResponse,
  ChatHistoryRequest,
  ChatHistoryResponse,
} from "./types";

// ============================================================================
// Configuration
// ============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const FUNCTIONS_BASE_URL = `${SUPABASE_URL}/functions/v1`;

// Test user for demo
export const TEST_USER_ID = "b0079fad-191b-46f9-80b7-2125a2e7d288";

// ============================================================================
// Category Mappings (10 Fixed Categories - DO NOT MODIFY)
// ============================================================================

export const CATEGORY_ICONS: Record<string, string> = {
  카페: "☕",
  영화관: "🎥",
  배달: "🛵",
  OTT: "🎬",
  교통: "🚇",
  편의점: "🏪",
  주유: "⛽",
  쇼핑: "👕",
  공항: "✈️",
  마트: "🛒",
};

export const CATEGORY_COLORS: Record<string, string> = {
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

// ============================================================================
// API Error Class
// ============================================================================

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ============================================================================
// Base Fetch Wrapper
// ============================================================================

async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new ApiError(
      "환경 변수가 설정되지 않았습니다. .env.local 파일을 확인해주세요.",
      500,
      "ENV_NOT_SET"
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

  try {
    const response = await fetch(`${FUNCTIONS_BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new ApiError(
        error.error || getDefaultErrorMessage(response.status),
        response.status,
        error.code
      );
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof ApiError) throw error;

    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError("요청 시간이 초과되었습니다", 408, "TIMEOUT");
    }

    throw new ApiError(
      "네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.",
      0,
      "NETWORK_ERROR"
    );
  }
}

function getDefaultErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return "잘못된 요청입니다";
    case 401:
      return "인증이 필요합니다";
    case 403:
      return "접근이 거부되었습니다";
    case 404:
      return "데이터를 찾을 수 없습니다";
    case 500:
      return "서버 오류가 발생했습니다";
    default:
      return "오류가 발생했습니다";
  }
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Analyze spending patterns and get benefit recommendations
 * POST /analyze-and-recommend
 */
export async function analyzeAndRecommend(
  request: AnalyzeRequest
): Promise<AnalyzeResponse> {
  return apiFetch<AnalyzeResponse>("/analyze-and-recommend", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

/**
 * Confirm selected benefits
 * POST /benefits-confirm
 */
export async function confirmBenefits(
  request: ConfirmBenefitsRequest
): Promise<ConfirmBenefitsResponse> {
  return apiFetch<ConfirmBenefitsResponse>("/benefits-confirm", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

/**
 * Get annual spending report
 * GET /reports-annual
 */
export async function getAnnualReport(
  request: AnnualReportRequest
): Promise<AnnualReportResponse> {
  const params = new URLSearchParams({ user_id: request.user_id });
  if (request.year) params.append("year", request.year);

  return apiFetch<AnnualReportResponse>(`/reports-annual?${params}`, {
    method: "GET",
  });
}

/**
 * Send chat message and get AI response
 * POST /chat
 */
export async function sendChatMessage(
  request: ChatRequest
): Promise<ChatResponse> {
  return apiFetch<ChatResponse>("/chat", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

/**
 * Get chat history for a chat room
 * GET /chat-history
 */
export async function getChatHistory(
  request: ChatHistoryRequest
): Promise<ChatHistoryResponse> {
  const params = new URLSearchParams({
    user_id: request.user_id,
    chat_room_id: request.chat_room_id,
  });
  if (request.limit) params.append("limit", request.limit.toString());

  return apiFetch<ChatHistoryResponse>(`/chat-history?${params}`, {
    method: "GET",
  });
}

// ============================================================================
// Transform Functions
// ============================================================================

/**
 * Transform API RecommendedBenefit to frontend Benefit format
 */
export function transformToBenefit(rec: RecommendedBenefit): Benefit {
  return {
    id: rec.benefit_option_id,
    title: rec.benefit_name,
    discount: formatDiscount(rec.benefit_type, rec.discount_rate, rec.monthly_limit),
    icon: CATEGORY_ICONS[rec.category] || "💳",
    reason: rec.reason,
    reasonIcon: getReasonIcon(rec.reason),
    category: rec.category,
    color: CATEGORY_COLORS[rec.category] || "#6b7280",
  };
}

function formatDiscount(
  type: string,
  rate: number,
  limit: number
): string {
  const limitText = limit > 0 ? ` (월 ${(limit / 10000).toFixed(0)}만원 한도)` : "";

  switch (type) {
    case "discount":
      return `${rate}% 할인${limitText}`;
    case "cashback":
      return `${rate}% 캐시백${limitText}`;
    case "points":
      return `${rate}배 포인트${limitText}`;
    default:
      return `${rate}% 할인${limitText}`;
  }
}

function getReasonIcon(reason: string): string {
  if (reason.includes("대화") || reason.includes("채팅") || reason.includes("언급")) {
    return "💬";
  }
  if (reason.includes("결제") || reason.includes("지출") || reason.includes("사용")) {
    return "💳";
  }
  if (reason.includes("%") || reason.includes("증가") || reason.includes("패턴") || reason.includes("분석")) {
    return "📊";
  }
  if (reason.includes("날") || reason.includes("곧") || reason.includes("예정")) {
    return "📅";
  }
  return "💡";
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if environment variables are configured
 */
export function isApiConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}
