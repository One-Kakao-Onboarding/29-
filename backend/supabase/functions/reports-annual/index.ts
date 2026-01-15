// 연간 리포트 Edge Function
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from "../_shared/cors.ts";
import {
  getSupabaseClient,
  getUser,
  getPaymentHistory,
  getPaymentSummaryByCategory,
} from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // GET 요청의 쿼리 파라미터 파싱
    const url = new URL(req.url);
    const user_id = url.searchParams.get("user_id");
    const year = url.searchParams.get("year");

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "user_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = getSupabaseClient();

    // 1. 사용자 확인
    await getUser(supabase, user_id);

    // 2. 결제 내역 조회
    const payments = await getPaymentHistory(supabase, user_id, 12);

    if (payments.length === 0) {
      return new Response(
        JSON.stringify({
          user_id,
          period: year || new Date().getFullYear().toString(),
          category_breakdown: {
            past_pattern: [],
            new_pattern: [],
          },
          monthly_trend: [],
          total_savings_achieved: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. 카테고리별 분석 (전체 기간)
    const pastPattern = await getPaymentSummaryByCategory(supabase, user_id, 12);

    // 4. 최근 3개월 패턴 (새로운 패턴)
    const newPattern = await getPaymentSummaryByCategory(supabase, user_id, 3);

    // 5. 월별 트렌드 계산
    const monthlyData: Record<
      string,
      { total_spending: number; categories: Record<string, number> }
    > = {};

    for (const payment of payments) {
      const date = new Date(payment.transaction_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { total_spending: 0, categories: {} };
      }

      monthlyData[monthKey].total_spending += payment.amount;

      const category = payment.category;
      if (!monthlyData[monthKey].categories[category]) {
        monthlyData[monthKey].categories[category] = 0;
      }
      monthlyData[monthKey].categories[category] += payment.amount;
    }

    const monthlyTrend = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => {
        const topCategory = Object.entries(data.categories).sort(
          ([, a], [, b]) => b - a
        )[0]?.[0] || "없음";

        // 예상 절감액 (총 지출의 3%)
        const savings = Math.round(data.total_spending * 0.03);

        return {
          month,
          total_spending: data.total_spending,
          savings,
          top_category: topCategory,
        };
      });

    // 6. 총 절감액 계산
    const totalSavings = monthlyTrend.reduce((sum, item) => sum + item.savings, 0);

    // 7. 기간 문자열 생성
    let period: string;
    if (year) {
      period = year;
    } else if (monthlyTrend.length > 0) {
      period = `${monthlyTrend[0].month} ~ ${monthlyTrend[monthlyTrend.length - 1].month}`;
    } else {
      period = new Date().getFullYear().toString();
    }

    return new Response(
      JSON.stringify({
        user_id,
        period,
        category_breakdown: {
          past_pattern: pastPattern.slice(0, 10).map((p) => ({
            category: p.category,
            percentage: p.percentage,
            amount: p.amount,
          })),
          new_pattern: newPattern.slice(0, 10).map((p) => ({
            category: p.category,
            percentage: p.percentage,
            amount: p.amount,
          })),
        },
        monthly_trend: monthlyTrend,
        total_savings_achieved: totalSavings,
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
