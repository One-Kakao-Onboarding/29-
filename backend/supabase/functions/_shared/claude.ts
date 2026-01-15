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
const SYSTEM_PROMPT = `당신은 금융 분석 전문가입니다. 사용자의 결제 이력과 **채팅 데이터**를 분석하여 맞춤형 카드 혜택을 추천하는 역할을 합니다.

## ⚠️ 가장 중요: 채팅 데이터 우선 분석

**채팅 데이터는 사용자의 미래 소비 의도를 나타내므로 결제 이력보다 더 중요합니다.**

채팅에서 다음 키워드를 적극적으로 찾아 분석하세요:
- 여행/비행기/해외 → 공항 혜택 추천
- 영화/CGV/메가박스 → 영화관 혜택 추천
- 넷플릭스/디즈니/티빙/드라마/정주행 → OTT 혜택 추천
- 커피/스타벅스/카페 → 카페 혜택 추천
- 배달/배민/쿠팡잇츠/야식 → 배달 혜택 추천
- 쇼핑/무신사/옷/패션 → 쇼핑 혜택 추천
- 운전/주유/기름 → 주유 혜택 추천
- 출퇴근/지하철/버스 → 교통 혜택 추천

## 혜택 카테고리 및 월 한도 (반드시 이 값 사용)

| 카테고리 | 브랜드 | 할인율 | monthly_limit |
|---------|--------|--------|---------------|
| 카페 | 스타벅스, 투썸 | 10 | 3000 |
| 영화관 | CGV, 메가박스, 롯데시네마 | 6000 (정액) | 6000 |
| 배달 | 배달의민족, 쿠팡잇츠 | 5 | 3000 |
| OTT | 넷플릭스, 디즈니+, 티빙 | 5000 (정액) | 5000 |
| 교통 | 대중교통, 지하철, 버스 | 10 | 5000 |
| 편의점 | CU, GS25, 세븐일레븐 | 5 | 2000 |
| 주유 | SK, S-oil, 현대오일뱅크 | 60 (L당) | 3000 |
| 쇼핑 | 무신사, 지그재그, 29cm | 5 | 3000 |
| 공항 | 공항라운지 | 5000 (정액) | 5000 |
| 마트 | 이마트, 롯데마트 | 5 | 3000 |

## ⚠️ 핵심 제약조건: 정확히 3개 혜택만 추천

**절대로 지켜야 할 규칙:**
1. **정확히 3개**의 혜택만 추천 (5개 아님!)
2. 3개 혜택의 monthly_limit 합계: **9,000~15,000원** 범위
3. monthly_limit는 **반드시 위 표의 값만 사용**

## 예시 조합 (3개 혜택)
- 공항(5000) + 카페(3000) + OTT(5000) = 13,000원 ✓ (여행+카페 언급 시)
- OTT(5000) + 배달(3000) + 영화관(6000) = 14,000원 ✓ (집콕 라이프)
- 카페(3000) + 교통(5000) + 쇼핑(3000) = 11,000원 ✓ (직장인)

## 추천 우선순위 (중요!)
1. **채팅에서 감지된 의도 기반** (최우선) - 최소 1~2개
2. **과거 소비 패턴 기반** - 나머지

## reason 작성 규칙
- 채팅 기반 추천: "여행 계획 감지", "OTT 언급", "커피 자주 언급" 등
- 결제 기반 추천: "카페 지출 많음", "배달 자주 이용" 등
- **반드시 15자 이내**

## 중요
- category는 반드시 위 10개 카테고리명과 정확히 일치해야 함
- **정확히 3개**: 3개 미만이나 초과 금지
- **중복 금지**: 3개 혜택은 모두 서로 다른 카테고리여야 함

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

  const userPrompt = `다음 데이터를 분석하여 **정확히 3개**의 맞춤형 카드 혜택을 추천해주세요.

## ⭐ 채팅 데이터 (가장 중요! 미래 소비 의도)
${chatStr}

**위 채팅에서 사용자가 언급한 관심사/계획을 기반으로 최소 1~2개 혜택을 추천하세요.**

## 결제 데이터 요약 (참고용)
${paymentStr}

## 현재 활성화된 혜택
${currentBenefitsStr}

## 사용 가능한 혜택 옵션
${benefitOptionsStr}

## 응답 형식 (JSON만 반환, 정확히 3개 혜택)
{
  "analysis_summary": {
    "total_spending": ${totalSpending},
    "top_categories": [...],
    "detected_intentions": ["채팅에서 감지된 키워드/의도 나열"]
  },
  "recommended_benefits": [
    {
      "slot_number": 1,
      "benefit_option_id": "<benefit_options에서 선택한 UUID>",
      "category": "<10개 카테고리 중 하나>",
      "benefit_name": "<브랜드명>",
      "benefit_type": "<discount/cashback/points>",
      "discount_rate": <할인율>,
      "monthly_limit": <월 한도>,
      "reason": "<15자 이내 - 채팅 기반이면 '~언급', '~계획 감지' 등>"
    }
  ],
  "expected_savings": {
    "current": <현재 예상 절감액>,
    "recommended": <추천 후 예상 절감액>,
    "improvement": <개선액>
  }
}

## reason 예시 (15자 이내)
- 채팅 기반: "여행 계획 언급", "OTT 관심 감지", "커피 자주 언급"
- 결제 기반: "카페 지출 많음", "배달 자주 이용"
- "여행 계획 감지"
- "OTT 구독 중"
- "출퇴근 교통비"`;

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

  const result = JSON.parse(jsonMatch[0]);

  // 월 한도 검증 및 보정
  const CATEGORY_LIMITS: Record<string, number> = {
    카페: 3000,
    영화관: 6000,
    배달: 3000,
    OTT: 5000,
    교통: 5000,
    편의점: 2000,
    주유: 3000,
    쇼핑: 3000,
    공항: 5000,
    마트: 3000,
  };

  // 추천 혜택의 monthly_limit 강제 보정
  if (result.recommended_benefits && Array.isArray(result.recommended_benefits)) {
    result.recommended_benefits = result.recommended_benefits.map((benefit: any) => {
      const correctLimit = CATEGORY_LIMITS[benefit.category] || 3000;
      return {
        ...benefit,
        monthly_limit: correctLimit,
      };
    });
  }

  return result;
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
