// Claude API 유틸리티
import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.18.0";

// 채팅 친구 시스템 프롬프트
const CHAT_FRIEND_PROMPT = `당신은 사용자의 20대 친구입니다. 카카오톡에서 친구처럼 자연스럽게 대화합니다.

성격:
- 친근하고 편안한 말투 (반말 사용)
- 공감을 잘 해주고 리액션이 좋음
- 가끔 ㅋㅋ, ㅎㅎ 같은 표현 사용
- 이모지는 적당히 사용 (과하지 않게)

대화 규칙:
- 짧고 간결하게 답변 (1-2문장)
- 자연스럽게 상대방 이야기에 반응
- 필요하면 관련 질문으로 대화 이어가기
- 절대 AI라고 밝히지 않기
- 금융/소비 관련 이야기가 나오면 자연스럽게 관심 보이기

예시:
- "오 대박! 어디로 여행가?"
- "ㅋㅋㅋ 진짜? 나도 그거 좋아해"
- "헐 부럽다~ 나도 가고 싶어"`;

// 분석 시스템 프롬프트
const SYSTEM_PROMPT = `당신은 금융 분석 전문가입니다. 사용자의 결제 이력과 채팅 데이터를 분석하여 맞춤형 카드 혜택을 추천하는 역할을 합니다.

당신의 목표:
1. 사용자의 과거 소비 패턴을 분석합니다.
2. 채팅 데이터에서 미래 소비 의도를 파악합니다.
3. 최적의 카드 혜택 5개를 추천합니다.

추천 시 고려사항:
- 과거 소비 패턴 기반 추천 3개: 실제로 많이 사용하는 카테고리에 혜택 제공
- 미래 소비 의도 기반 추천 2개: 채팅에서 감지된 계획에 맞는 혜택 제공
- 각 추천에는 명확한 이유를 포함해야 합니다.

응답은 반드시 JSON 형식으로 제공해야 합니다.`;

export async function analyzeAndRecommend(
  paymentSummary: Array<{
    category: string;
    amount: number;
    percentage: number;
    transaction_count: number;
  }>,
  chatLogs: Array<{ message_content: string; sender_type: string }>,
  currentBenefits: Array<any>,
  benefitOptions: Array<any>
): Promise<{
  analysis_summary: {
    total_spending: number;
    top_categories: Array<{ category: string; amount: number; percentage: number }>;
    detected_intentions: string[];
  };
  recommended_benefits: Array<{
    slot_number: number;
    benefit_option_id: string;
    category: string;
    benefit_name: string;
    benefit_type: string;
    discount_rate: number;
    monthly_limit: number;
    reason: string;
  }>;
  expected_savings: {
    current: number;
    recommended: number;
    improvement: number;
  };
}> {
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!anthropicKey) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }

  const client = new Anthropic({ apiKey: anthropicKey });

  // 데이터 포맷팅
  const totalSpending = paymentSummary.reduce((sum, p) => sum + p.amount, 0);

  const paymentStr = paymentSummary.length > 0
    ? `총 소비액: ${totalSpending.toLocaleString()}원\n\n카테고리별 소비:\n${paymentSummary
        .slice(0, 10)
        .map(
          (p) =>
            `- ${p.category}: ${p.amount.toLocaleString()}원 (${p.percentage}%, ${p.transaction_count}건)`
        )
        .join("\n")}`
    : "결제 내역이 없습니다.";

  const chatStr = chatLogs.length > 0
    ? chatLogs
        .slice(0, 50)
        .map((c) => `[${c.sender_type}] ${c.message_content}`)
        .join("\n")
    : "채팅 데이터가 없습니다.";

  const currentBenefitsStr = currentBenefits.length > 0
    ? `현재 활성 혜택:\n${currentBenefits
        .map(
          (b) =>
            `- Slot ${b.slot_number}: ${b.benefit_options?.benefit_name || "Unknown"} (${
              b.benefit_options?.category || "Unknown"
            })`
        )
        .join("\n")}`
    : "현재 활성화된 혜택이 없습니다.";

  const benefitOptionsStr = benefitOptions
    .map(
      (opt) =>
        `- ID: ${opt.id}\n  카테고리: ${opt.category}\n  혜택명: ${opt.benefit_name}\n  타입: ${opt.benefit_type}\n  최대 할인율: ${opt.max_discount_rate}%\n  월 한도: ${opt.max_monthly_limit?.toLocaleString()}원`
    )
    .join("\n\n");

  const userPrompt = `다음 데이터를 분석하여 맞춤형 카드 혜택 5개를 추천해주세요.

## 결제 데이터 요약
${paymentStr}

## 채팅 데이터 (미래 소비 의도 파악용)
${chatStr}

## 현재 활성화된 혜택
${currentBenefitsStr}

## 사용 가능한 혜택 옵션
${benefitOptionsStr}

## 응답 형식 (JSON만 반환)
{
  "analysis_summary": {
    "total_spending": ${totalSpending},
    "top_categories": [...],
    "detected_intentions": [...]
  },
  "recommended_benefits": [
    {
      "slot_number": 1,
      "benefit_option_id": "<benefit_options에서 선택한 UUID>",
      "category": "<카테고리>",
      "benefit_name": "<혜택명>",
      "benefit_type": "<discount/cashback/points>",
      "discount_rate": <할인율>,
      "monthly_limit": <월 한도>,
      "reason": "<추천 이유>"
    }
  ],
  "expected_savings": {
    "current": <현재 예상 절감액>,
    "recommended": <추천 후 예상 절감액>,
    "improvement": <개선액>
  }
}`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const responseText = message.content[0].type === "text" ? message.content[0].text : "";

  // JSON 추출
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No JSON found in response");
  }

  return JSON.parse(jsonMatch[0]);
}

// 채팅 응답 생성
export async function generateChatResponse(
  chatHistory: Array<{ message_content: string; sender_type: string }>,
  newMessage: string
): Promise<string> {
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!anthropicKey) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }

  const client = new Anthropic({ apiKey: anthropicKey });

  // 채팅 히스토리를 Claude 메시지 형식으로 변환
  const messages: Array<{ role: "user" | "assistant"; content: string }> = [];

  // 최근 10개 메시지만 컨텍스트로 사용 (역순으로 조회됨)
  const recentHistory = chatHistory.slice(0, 10).reverse();

  for (const msg of recentHistory) {
    messages.push({
      role: msg.sender_type === "user" ? "user" : "assistant",
      content: msg.message_content,
    });
  }

  // 새 메시지 추가
  messages.push({ role: "user", content: newMessage });

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 256,
    system: CHAT_FRIEND_PROMPT,
    messages: messages,
  });

  const responseText = response.content[0].type === "text" ? response.content[0].text : "";
  return responseText.trim();
}
