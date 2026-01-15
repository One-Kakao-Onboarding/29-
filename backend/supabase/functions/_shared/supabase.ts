// Supabase 클라이언트 유틸리티
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export function getSupabaseClient(authHeader?: string): SupabaseClient {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: authHeader ? { Authorization: authHeader } : {},
    },
  });
}

// 결제 내역 조회
export async function getPaymentHistory(
  supabase: SupabaseClient,
  userId: string,
  months: number = 12
) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const { data, error } = await supabase
    .from("payment_history")
    .select("*")
    .eq("user_id", userId)
    .gte("transaction_date", startDate.toISOString())
    .order("transaction_date", { ascending: false });

  if (error) throw error;
  return data || [];
}

// 카테고리별 요약
export async function getPaymentSummaryByCategory(
  supabase: SupabaseClient,
  userId: string,
  months: number = 12
) {
  const payments = await getPaymentHistory(supabase, userId, months);

  const categoryTotals: Record<string, { amount: number; count: number }> = {};
  let totalAmount = 0;

  for (const payment of payments) {
    const category = payment.category;
    const amount = payment.amount;
    totalAmount += amount;

    if (!categoryTotals[category]) {
      categoryTotals[category] = { amount: 0, count: 0 };
    }
    categoryTotals[category].amount += amount;
    categoryTotals[category].count += 1;
  }

  return Object.entries(categoryTotals)
    .map(([category, data]) => ({
      category,
      amount: data.amount,
      percentage: totalAmount > 0 ? Math.round((data.amount / totalAmount) * 1000) / 10 : 0,
      transaction_count: data.count,
    }))
    .sort((a, b) => b.amount - a.amount);
}

// 채팅 로그 조회
export async function getChatLogs(
  supabase: SupabaseClient,
  userId: string,
  chatRoomId?: string,
  limit: number = 100
) {
  let query = supabase
    .from("chat_logs")
    .select("*")
    .eq("user_id", userId)
    .order("sent_at", { ascending: false })
    .limit(limit);

  if (chatRoomId) {
    query = query.eq("chat_room_id", chatRoomId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// 혜택 옵션 조회
export async function getBenefitOptions(
  supabase: SupabaseClient,
  isActive: boolean = true
) {
  const { data, error } = await supabase
    .from("benefit_options")
    .select("*")
    .eq("is_active", isActive);

  if (error) throw error;
  return data || [];
}

// 사용자 혜택 조회
export async function getUserBenefits(
  supabase: SupabaseClient,
  userId: string,
  isActive: boolean = true
) {
  const { data, error } = await supabase
    .from("card_benefits")
    .select("*, benefit_options(*)")
    .eq("user_id", userId)
    .eq("is_active", isActive)
    .order("slot_number");

  if (error) throw error;
  return data || [];
}

// 사용자 혜택 업데이트
export async function updateUserBenefits(
  supabase: SupabaseClient,
  userId: string,
  benefits: Array<{
    benefit_option_id: string;
    slot_number: number;
    custom_discount_rate?: number;
    custom_monthly_limit?: number;
  }>
) {
  // 기존 혜택 비활성화
  await supabase
    .from("card_benefits")
    .update({ is_active: false })
    .eq("user_id", userId)
    .eq("is_active", true);

  // 새 혜택 추가
  const now = new Date().toISOString();
  const newBenefits = benefits.map((b) => ({
    user_id: userId,
    benefit_option_id: b.benefit_option_id,
    custom_discount_rate: b.custom_discount_rate,
    custom_monthly_limit: b.custom_monthly_limit,
    slot_number: b.slot_number,
    is_active: true,
    activated_at: now,
  }));

  const { data, error } = await supabase
    .from("card_benefits")
    .insert(newBenefits)
    .select();

  if (error) throw error;
  return data || [];
}

// 사용자 조회
export async function getUser(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data;
}

// 프론트엔드 결제 데이터 변환
export function convertFrontendPayments(
  payments: Array<{
    merchant: string;
    amount: string;
    date: string;
    category: string;
  }>
): Array<{
  category: string;
  amount: number;
  percentage: number;
  transaction_count: number;
}> {
  const categoryTotals: Record<string, { amount: number; count: number }> = {};
  let totalAmount = 0;

  for (const payment of payments) {
    // Parse amount string "350,000원" -> 350000
    const amount = parseInt(payment.amount.replace(/[^0-9]/g, ''), 10) || 0;
    totalAmount += amount;

    if (!categoryTotals[payment.category]) {
      categoryTotals[payment.category] = { amount: 0, count: 0 };
    }
    categoryTotals[payment.category].amount += amount;
    categoryTotals[payment.category].count += 1;
  }

  return Object.entries(categoryTotals)
    .map(([category, data]) => ({
      category,
      amount: data.amount,
      percentage: totalAmount > 0
        ? Math.round((data.amount / totalAmount) * 1000) / 10
        : 0,
      transaction_count: data.count,
    }))
    .sort((a, b) => b.amount - a.amount);
}

// 채팅 메시지 저장
export async function saveChatMessage(
  supabase: SupabaseClient,
  userId: string,
  chatRoomId: string,
  messageContent: string,
  senderType: "user" | "ai"
): Promise<{ id: string; sent_at: string }> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("chat_logs")
    .insert({
      user_id: userId,
      chat_room_id: chatRoomId,
      message_content: messageContent,
      sender_type: senderType,
      sent_at: now,
    })
    .select("id, sent_at")
    .single();

  if (error) throw error;
  return data;
}
