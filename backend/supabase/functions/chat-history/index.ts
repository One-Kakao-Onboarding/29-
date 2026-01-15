// 채팅 히스토리 조회 Edge Function
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getSupabaseClient, getChatLogs, getUser } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const user_id = url.searchParams.get("user_id");
    const chat_room_id = url.searchParams.get("chat_room_id");
    const limit = parseInt(url.searchParams.get("limit") || "50");

    // 필수 파라미터 검증
    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "user_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!chat_room_id) {
      return new Response(
        JSON.stringify({ error: "chat_room_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = getSupabaseClient();

    // 사용자 확인
    try {
      await getUser(supabase, user_id);
    } catch {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 채팅 히스토리 조회
    const chatLogs = await getChatLogs(supabase, user_id, chat_room_id, limit);

    // 시간순 정렬 (오래된 것부터)
    const sortedLogs = chatLogs.reverse();

    // 응답 형식 변환
    const messages = sortedLogs.map((log: any) => ({
      id: log.id,
      sender: log.sender_type === "user" ? "me" : "ai",
      message: log.message_content,
      time: new Date(log.sent_at).toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
      timestamp: log.sent_at,
    }));

    return new Response(
      JSON.stringify({
        chat_room_id,
        messages,
        count: messages.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Chat History Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
