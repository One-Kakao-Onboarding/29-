// 분석 및 추천 Edge Function
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from "../_shared/cors.ts";
import {
  getSupabaseClient,
  getPaymentSummaryByCategory,
  getChatLogs,
  getUserBenefits,
  getBenefitOptions,
  getUser,
  convertFrontendPayments,
} from "../_shared/supabase.ts";
import { analyzeAndRecommend } from "../_shared/claude.ts";

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { user_id, chat_room_id, analysis_period_months = 12, payments } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "user_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = getSupabaseClient();

    // 1. 사용자 확인
    const user = await getUser(supabase, user_id);

    // 2. 결제 내역 요약 (프론트엔드 데이터 우선, 없으면 DB 조회)
    let paymentSummary;
    if (payments && Array.isArray(payments) && payments.length > 0) {
      // 프론트엔드에서 전달받은 결제 데이터 사용
      paymentSummary = convertFrontendPayments(payments);
    } else {
      // DB에서 조회
      paymentSummary = await getPaymentSummaryByCategory(
        supabase,
        user_id,
        analysis_period_months
      );
    }

    // 3. 채팅 로그 조회
    const chatLogs = await getChatLogs(supabase, user_id, chat_room_id);

    // 4. 현재 혜택 조회
    const currentBenefits = await getUserBenefits(supabase, user_id);

    // 5. 사용 가능한 혜택 옵션 조회
    const benefitOptions = await getBenefitOptions(supabase);

    // 6. LLM 분석 및 추천
    const llmResult = await analyzeAndRecommend(
      paymentSummary,
      chatLogs,
      currentBenefits,
      benefitOptions
    );

    // 7. 응답 구성
    const response = {
      user_id,
      analysis_summary: llmResult.analysis_summary,
      current_benefits: currentBenefits,
      recommended_benefits: llmResult.recommended_benefits,
      comparison: {
        expected_monthly_savings: llmResult.expected_savings,
      },
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
