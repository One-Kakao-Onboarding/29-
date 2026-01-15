/**
 * API Types for Supabase Edge Functions
 * Base URL: https://fvlanbsclsewkfypomlr.supabase.co/functions/v1
 */

// ============================================================================
// Request Types
// ============================================================================

export interface PaymentData {
  merchant: string;
  amount: string;
  date: string;
  category: string;
}

export interface ChatMessageData {
  sender: "me" | "ai";
  message: string;
}

export interface AnalyzeRequest {
  user_id: string;
  chat_room_id?: string;
  analysis_period_months?: number;
  payments?: PaymentData[];
  chat_messages?: ChatMessageData[];
}

export interface ConfirmBenefitsRequest {
  user_id: string;
  benefits: Array<{
    benefit_option_id: string;
    slot_number: number;
    custom_discount_rate?: number;
    custom_monthly_limit?: number;
  }>;
}

export interface AnnualReportRequest {
  user_id: string;
  year?: string;
}

export interface ChatRequest {
  user_id: string;
  chat_room_id: string;
  message: string;
}

// ============================================================================
// Response Types
// ============================================================================

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
}

export interface AnalysisSummary {
  total_spending: number;
  top_categories: CategoryBreakdown[];
  detected_intentions: string[];
}

export interface CurrentBenefit {
  slot_number: number;
  benefit_option_id: string;
  benefit_options: {
    benefit_name: string;
    category: string;
    benefit_type: string;
    max_discount_rate: number;
    max_monthly_limit: number;
  };
  is_active: boolean;
  activated_at: string;
}

export interface RecommendedBenefit {
  slot_number: number;
  benefit_option_id: string;
  category: string;
  benefit_name: string;
  benefit_type: "discount" | "cashback" | "points";
  discount_rate: number;
  monthly_limit: number;
  reason: string;
}

export interface SavingsComparison {
  expected_monthly_savings: {
    current: number;
    recommended: number;
    improvement: number;
  };
}

export interface AnalyzeResponse {
  user_id: string;
  analysis_summary: AnalysisSummary;
  current_benefits: CurrentBenefit[];
  recommended_benefits: RecommendedBenefit[];
  comparison: SavingsComparison;
}

export interface ConfirmedBenefit {
  user_id: string;
  benefit_option_id: string;
  slot_number: number;
  custom_discount_rate?: number;
  custom_monthly_limit?: number;
  is_active: boolean;
  activated_at: string;
}

export interface ConfirmBenefitsResponse {
  success: boolean;
  confirmed_benefits: ConfirmedBenefit[];
  effective_from: string;
}

export interface CategoryPattern {
  category: string;
  percentage: number;
  amount: number;
}

export interface MonthlyTrend {
  month: string;
  total_spending: number;
  savings: number;
  top_category: string;
}

export interface AnnualReportResponse {
  user_id: string;
  period: string;
  category_breakdown: {
    past_pattern: CategoryPattern[];
    new_pattern: CategoryPattern[];
  };
  monthly_trend: MonthlyTrend[];
  total_savings_achieved: number;
}

// ============================================================================
// Chat Response Type
// ============================================================================

export interface ChatResponse {
  user_message_id: string;
  ai_message_id: string;
  ai_response: string;
  timestamp: string;
}

// ============================================================================
// Chat History Types
// ============================================================================

export interface ChatHistoryRequest {
  user_id: string;
  chat_room_id: string;
  limit?: number;
}

export interface ChatHistoryMessage {
  id: string;
  sender: "me" | "ai";
  message: string;
  time: string;
  timestamp: string;
}

export interface ChatHistoryResponse {
  chat_room_id: string;
  messages: ChatHistoryMessage[];
  count: number;
}

// ============================================================================
// API Error Type
// ============================================================================

export interface ApiErrorResponse {
  error: string;
  code?: string;
}
