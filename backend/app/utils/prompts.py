"""LLM 프롬프트 템플릿"""

SYSTEM_PROMPT = """당신은 금융 분석 전문가입니다. 사용자의 결제 이력과 채팅 데이터를 분석하여 맞춤형 카드 혜택을 추천하는 역할을 합니다.

당신의 목표:
1. 사용자의 과거 소비 패턴을 분석합니다.
2. 채팅 데이터에서 미래 소비 의도를 파악합니다.
3. 최적의 카드 혜택 5개를 추천합니다.

추천 시 고려사항:
- 과거 소비 패턴 기반 추천 3개: 실제로 많이 사용하는 카테고리에 혜택 제공
- 미래 소비 의도 기반 추천 2개: 채팅에서 감지된 계획에 맞는 혜택 제공
- 각 추천에는 명확한 이유를 포함해야 합니다.

응답은 반드시 JSON 형식으로 제공해야 합니다."""


def build_analysis_prompt(
    payment_summary: str,
    chat_logs: str,
    current_benefits: str,
    benefit_options: str,
) -> str:
    """분석 및 추천 프롬프트 생성"""
    return f"""다음 데이터를 분석하여 맞춤형 카드 혜택 5개를 추천해주세요.

## 결제 데이터 요약
{payment_summary}

## 채팅 데이터 (미래 소비 의도 파악용)
{chat_logs}

## 현재 활성화된 혜택
{current_benefits}

## 사용 가능한 혜택 옵션
{benefit_options}

## 요청사항
1. 과거 소비 패턴 분석 결과를 요약해주세요.
2. 채팅에서 감지된 미래 소비 의도를 나열해주세요.
3. 5개의 맞춤형 혜택을 추천해주세요:
   - slot 1-3: 과거 소비 패턴 기반
   - slot 4-5: 미래 소비 의도 기반

## 응답 형식 (JSON)
```json
{{
  "analysis_summary": {{
    "total_spending": <총 소비액>,
    "top_categories": [
      {{"category": "<카테고리명>", "amount": <금액>, "percentage": <비율>}}
    ],
    "detected_intentions": ["<의도1>", "<의도2>"]
  }},
  "recommended_benefits": [
    {{
      "slot_number": 1,
      "benefit_option_id": "<benefit_options에서 선택한 UUID>",
      "category": "<카테고리>",
      "benefit_name": "<혜택명>",
      "benefit_type": "<discount/cashback/points>",
      "discount_rate": <할인율>,
      "monthly_limit": <월 한도>,
      "reason": "<추천 이유>"
    }}
  ],
  "expected_savings": {{
    "current": <현재 예상 절감액>,
    "recommended": <추천 후 예상 절감액>,
    "improvement": <개선액>
  }}
}}
```

benefit_options에 있는 실제 UUID와 정보를 사용하여 추천해주세요."""


def build_chat_analysis_prompt(chat_logs: str) -> str:
    """채팅 데이터에서 미래 소비 의도 추출 프롬프트"""
    return f"""다음 채팅 데이터에서 사용자의 미래 소비 의도를 추출해주세요.

## 채팅 데이터
{chat_logs}

## 추출 대상
- 여행 계획 (국내/해외)
- 대형 구매 계획 (가전, 가구 등)
- 새로운 취미/활동 시작 (헬스, 골프 등)
- 이사/주거 관련 계획
- 구독 서비스 시작/변경 계획
- 기타 큰 지출이 예상되는 계획

## 응답 형식 (JSON)
```json
{{
  "detected_intentions": [
    {{
      "intention": "<의도 설명>",
      "confidence": <0.0-1.0 신뢰도>,
      "related_category": "<관련 소비 카테고리>",
      "evidence": "<근거가 되는 채팅 내용 요약>"
    }}
  ]
}}
```

명확한 의도가 없으면 빈 배열을 반환해주세요."""
