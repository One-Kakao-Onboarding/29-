// 채팅 Edge Function - AI 친구 대화
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from "../_shared/cors.ts";
import {
  getSupabaseClient,
  getChatLogs,
  saveChatMessage,
  getUser,
} from "../_shared/supabase.ts";
import { generateChatResponse } from "../_shared/claude.ts";

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { user_id, chat_room_id, message } = await req.json();

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

    if (!message || message.trim() === "") {
      return new Response(
        JSON.stringify({ error: "message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = getSupabaseClient();

    // 1. 사용자 확인
    try {
      await getUser(supabase, user_id);
    } catch {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. 사용자 메시지 DB 저장
    const userMessageResult = await saveChatMessage(
      supabase,
      user_id,
      chat_room_id,
      message.trim(),
      "user"
    );

    // 3. 이전 채팅 히스토리 조회 (컨텍스트용)
    const chatHistory = await getChatLogs(supabase, user_id, chat_room_id, 20);

    // 4. Claude API로 응답 생성
    const aiResponse = await generateChatResponse(chatHistory, message.trim());

    // 5. AI 응답 DB 저장
    const aiMessageResult = await saveChatMessage(
      supabase,
      user_id,
      chat_room_id,
      aiResponse,
      "ai"
    );

    // 6. 응답 반환
    return new Response(
      JSON.stringify({
        user_message_id: userMessageResult.id,
        ai_message_id: aiMessageResult.id,
        ai_response: aiResponse,
        timestamp: aiMessageResult.sent_at,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Chat Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
