// 혜택 확정 Edge Function
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from "../_shared/cors.ts";
import {
  getSupabaseClient,
  getUser,
  updateUserBenefits,
  getBenefitOptions,
} from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { user_id, benefits } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "user_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!benefits || !Array.isArray(benefits) || benefits.length === 0) {
      return new Response(
        JSON.stringify({ error: "benefits array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = getSupabaseClient();

    // 1. 사용자 확인
    await getUser(supabase, user_id);

    // 2. 혜택 옵션 유효성 검증
    const benefitOptions = await getBenefitOptions(supabase);
    const validOptionIds = new Set(benefitOptions.map((opt) => opt.id));

    for (const benefit of benefits) {
      if (!validOptionIds.has(benefit.benefit_option_id)) {
        return new Response(
          JSON.stringify({
            error: `Invalid benefit_option_id: ${benefit.benefit_option_id}`,
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // 3. 새 혜택 저장
    const newBenefits = await updateUserBenefits(supabase, user_id, benefits);

    // 4. 변경 이력 저장
    const { error: historyError } = await supabase.from("benefit_history").insert({
      user_id,
      action_type: "confirmed",
      new_benefits: benefits,
      recommendation_reason: "User confirmed benefits",
    });

    if (historyError) {
      console.error("Failed to save history:", historyError);
    }

    // 5. 적용 시작일 계산 (다음 날 00:00)
    const effectiveFrom = new Date();
    effectiveFrom.setDate(effectiveFrom.getDate() + 1);
    effectiveFrom.setHours(0, 0, 0, 0);

    return new Response(
      JSON.stringify({
        success: true,
        confirmed_benefits: newBenefits,
        effective_from: effectiveFrom.toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
