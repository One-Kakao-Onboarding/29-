# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**AI Dynamic Custom Card** - 카카오페이 결제 내역과 카카오톡 채팅 데이터를 AI로 분석하여 맞춤형 카드 혜택을 추천하는 서비스

## Production URLs

- **Frontend:** https://famous-rolypoly-fcde1b.netlify.app
- **Backend API:** https://fvlanbsclsewkfypomlr.supabase.co/functions/v1
- **Supabase Dashboard:** https://supabase.com/dashboard/project/fvlanbsclsewkfypomlr

---

## 구현된 기능 목록

### 1. AI 채팅 (카카오톡 시뮬레이터)
- 사용자가 메시지 입력 → Claude AI가 20대 친구처럼 응답
- 모든 채팅은 DB(`chat_logs` 테이블)에 자동 저장
- `chatRoomId`는 localStorage에 저장되어 새로고침해도 이전 대화 유지
- "비우기" 버튼 클릭 시 새 채팅방 생성 (이전 대화 초기화)
- 한글 IME 버퍼링 버그 수정됨 (`onCompositionStart/End` 처리)

### 2. AI 분석 & 혜택 추천
- "AI로 분석하고 혜택 추천받기" 버튼 클릭 시 실행
- 결제 내역 + 채팅 내역을 Claude AI가 분석
- 맞춤형 카드 혜택 5개 추천 (중복 카테고리/브랜드 없음)
- 추천 이유는 15자 이내로 짧게 표시

### 3. 혜택 교체
- 추천된 혜택 카드 클릭 시 드롭다운 표시
- 대체 혜택 목록에서 선택하여 교체 가능

### 4. 연간 리포트
- 연간 소비 패턴 분석 리포트 표시
- 카테고리별 지출 비율 차트

### 5. 3D 카드 시각화
- Three.js로 구현된 3D 카드 렌더링
- 선택된 혜택 카테고리 색상이 카드에 반영

---

## API 엔드포인트 상세

Base URL: `https://fvlanbsclsewkfypomlr.supabase.co/functions/v1`

모든 요청에 필요: `Authorization: Bearer <ANON_KEY>`

### POST /chat
AI 채팅 - 메시지 저장 및 Claude 응답 생성

**Request:**
```json
{
  "user_id": "b0079fad-191b-46f9-80b7-2125a2e7d288",
  "chat_room_id": "uuid-string",
  "message": "여행 가고 싶다"
}
```

**Response:**
```json
{
  "user_message_id": "uuid",
  "ai_message_id": "uuid",
  "ai_response": "오 대박! 어디로 여행가?",
  "timestamp": "2026-01-15T05:20:13.934+00:00"
}
```

**로직:**
1. 사용자 메시지를 `chat_logs` 테이블에 저장
2. 최근 10개 채팅 히스토리 조회 (컨텍스트용)
3. Claude API 호출 (친구처럼 대화)
4. AI 응답을 `chat_logs` 테이블에 저장
5. 응답 반환

---

### GET /chat-history
이전 채팅 내역 조회

**Request:**
```
GET /chat-history?user_id=xxx&chat_room_id=xxx&limit=50
```

**Response:**
```json
{
  "chat_room_id": "uuid",
  "messages": [
    {
      "id": "uuid",
      "sender": "me",
      "message": "안녕",
      "time": "오후 2:30",
      "timestamp": "2026-01-15T05:30:00.000+00:00"
    }
  ],
  "count": 10
}
```

---

### POST /analyze-and-recommend
결제 + 채팅 데이터 분석 및 혜택 추천

**Request:**
```json
{
  "user_id": "b0079fad-191b-46f9-80b7-2125a2e7d288",
  "chat_room_id": "uuid-string",
  "analysis_period_months": 12
}
```

**Response:**
```json
{
  "user_id": "uuid",
  "analysis_summary": {
    "total_spending": 5000000,
    "top_categories": [
      { "category": "카페", "amount": 500000, "percentage": 10 }
    ],
    "detected_intentions": ["여행 계획", "영화 관람"]
  },
  "current_benefits": [...],
  "recommended_benefits": [
    {
      "slot_number": 1,
      "benefit_option_id": "uuid",
      "category": "카페",
      "benefit_name": "스타벅스",
      "benefit_type": "discount",
      "discount_rate": 10,
      "monthly_limit": 50000,
      "reason": "카페 이용 많음"
    }
  ],
  "comparison": {
    "expected_monthly_savings": {
      "current": 10000,
      "recommended": 25000,
      "improvement": 15000
    }
  }
}
```

**로직:**
1. `payment_transactions` 테이블에서 결제 내역 조회
2. `chat_logs` 테이블에서 채팅 내역 조회
3. `benefit_options` 테이블에서 사용 가능한 혜택 목록 조회
4. Claude AI에 데이터 전달하여 분석
5. 5개 혜택 추천 (카테고리 중복 없음)

---

### POST /benefits-confirm
선택한 혜택 확정 저장

**Request:**
```json
{
  "user_id": "uuid",
  "benefits": [
    {
      "benefit_option_id": "uuid",
      "slot_number": 1
    }
  ]
}
```

---

### GET /reports-annual
연간 소비 리포트 조회

**Request:**
```
GET /reports-annual?user_id=xxx&year=2025
```

---

## 10개 고정 혜택 카테고리

| 카테고리 | 색상 | 아이콘 | 브랜드 |
|---------|------|-------|-------|
| 카페 | 초록 (#22c55e) | ☕ | 스타벅스, 할리스, 투썸 |
| 영화관 | 주황 (#f97316) | 🎥 | CGV, 메가박스, 롯데시네마 |
| 배달 | 노랑 (#eab308) | 🛵 | 배달의민족, 쿠팡잇츠 |
| OTT | 빨강 (#ef4444) | 🎬 | 넷플릭스, 디즈니+, 티빙, 웨이브 |
| 교통 | 파랑 (#3b82f6) | 🚇 | 시내버스, 시외버스, 지하철 |
| 편의점 | 보라 (#a855f7) | 🏪 | CU, GS25, 세븐일레븐, emart everyday |
| 주유 | 연두 (#84cc16) | ⛽ | S-oil, 현대오일뱅크, SK |
| 쇼핑 | 핑크 (#ec4899) | 👕 | 무신사, 지그재그, 8-seconds, W컨셉, 29cm |
| 공항 | 하늘 (#06b6d4) | ✈️ | 공항라운지, 대한항공, 아시아나, 진에어 |
| 마트 | 갈색 (#a16207) | 🛒 | 이마트, 롯데마트 |

**중요:** 이 카테고리 목록은 프론트엔드와 백엔드 Claude 프롬프트에서 동기화되어야 함
- Frontend: `services/api.ts` → `CATEGORY_ICONS`, `CATEGORY_COLORS`
- Backend: `_shared/claude.ts` → `SYSTEM_PROMPT`

---

## 주요 파일 구조

### Backend (Supabase Edge Functions)
```
backend/supabase/functions/
├── _shared/
│   ├── claude.ts          # Claude API 유틸리티
│   │   ├── CHAT_FRIEND_PROMPT   # 친구 대화용 시스템 프롬프트
│   │   ├── SYSTEM_PROMPT        # 분석용 시스템 프롬프트 (카테고리 목록 포함)
│   │   ├── analyzeAndRecommend()
│   │   └── generateChatResponse()
│   ├── supabase.ts        # DB 쿼리 함수
│   │   ├── getUser()
│   │   ├── getChatLogs()
│   │   ├── saveChatMessage()
│   │   ├── getPaymentSummary()
│   │   └── getBenefitOptions()
│   └── cors.ts            # CORS 헤더
├── chat/index.ts          # POST /chat
├── chat-history/index.ts  # GET /chat-history
├── analyze-and-recommend/index.ts
├── benefits-confirm/index.ts
└── reports-annual/index.ts
```

### Frontend (Next.js 16)
```
frontend/orott-ai-card (1)/
├── app/
│   └── page.tsx           # 메인 페이지
│       ├── chatRoomId     # localStorage 저장 (세션 유지)
│       ├── handleSendMessage()   # 채팅 전송
│       ├── handleAnalyze()       # AI 분석 요청
│       ├── handleClearChat()     # 채팅 초기화
│       └── handleSwapBenefit()   # 혜택 교체
├── services/
│   ├── api.ts             # API 클라이언트
│   │   ├── sendChatMessage()
│   │   ├── getChatHistory()
│   │   ├── analyzeAndRecommend()
│   │   ├── confirmBenefits()
│   │   ├── getAnnualReport()
│   │   └── transformToBenefit()  # reason 15자 truncate
│   └── types.ts           # TypeScript 인터페이스
├── components/
│   ├── context-simulator.tsx  # 카카오톡/페이 시뮬레이터
│   │   └── IME 버퍼링 처리 (onCompositionStart/End)
│   ├── benefit-card.tsx       # 혜택 카드 UI
│   ├── card-3d.tsx            # Three.js 3D 카드
│   ├── oroft-service.tsx      # 혜택 추천 섹션
│   └── consumption-report.tsx # 연간 리포트
└── .env.local             # 환경변수
```

---

## 데이터 흐름

```
┌─────────────────────────────────────────────────────────────┐
│                      사용자 플로우                           │
└─────────────────────────────────────────────────────────────┘

1. 페이지 로드
   └─→ localStorage에서 chatRoomId 읽기 (없으면 새로 생성)
   └─→ GET /chat-history 호출하여 이전 채팅 불러오기

2. 채팅 입력
   └─→ POST /chat 호출
       └─→ 사용자 메시지 DB 저장
       └─→ Claude API (친구 대화)
       └─→ AI 응답 DB 저장
       └─→ UI에 응답 표시

3. "AI로 분석하고 혜택 추천받기" 클릭
   └─→ POST /analyze-and-recommend 호출
       └─→ payment_transactions에서 결제 내역 조회
       └─→ chat_logs에서 채팅 내역 조회 (chatRoomId 기준)
       └─→ Claude API (분석 + 추천)
       └─→ 5개 혜택 추천 반환
   └─→ 3D 카드에 혜택 색상 반영
   └─→ 혜택 카드 UI 표시

4. 혜택 교체
   └─→ 혜택 카드 클릭 → 드롭다운 표시
   └─→ 대체 혜택 선택 → UI 업데이트

5. "비우기" 클릭
   └─→ 새 chatRoomId 생성
   └─→ localStorage 업데이트
   └─→ 채팅 UI 초기화
```

---

## 개발 명령어

### Frontend
```bash
cd "frontend/orott-ai-card (1)"
pnpm install
pnpm dev      # 개발 서버 (localhost:3000)
pnpm build    # 프로덕션 빌드
```

### Backend (Edge Functions 배포)
```bash
source ~/.claude/deploy-config.sh
supabase functions deploy chat --project-ref fvlanbsclsewkfypomlr
supabase functions deploy chat-history --project-ref fvlanbsclsewkfypomlr
supabase functions deploy analyze-and-recommend --project-ref fvlanbsclsewkfypomlr
supabase functions deploy benefits-confirm --project-ref fvlanbsclsewkfypomlr
supabase functions deploy reports-annual --project-ref fvlanbsclsewkfypomlr
```

### Frontend 배포 (Netlify)
```bash
cd "frontend/orott-ai-card (1)"
netlify deploy --prod
```

---

## 환경변수

### Frontend (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://fvlanbsclsewkfypomlr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Backend (Supabase Dashboard > Edge Functions > Secrets)
```
SUPABASE_URL=https://fvlanbsclsewkfypomlr.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
ANTHROPIC_API_KEY=<anthropic_api_key>
```

---

## 테스트 데이터

- **Test User ID:** `b0079fad-191b-46f9-80b7-2125a2e7d288`
- **Mock Data:** 1,093 transactions + 50 chat logs (1년치)

---

## 알려진 이슈 및 해결된 버그

### 해결됨
1. **한글 IME 버퍼링** - 채팅 입력 후 마지막 글자 남는 문제 → `onCompositionStart/End` 처리
2. **SSR hydration** - localStorage 읽기 실패 → `useEffect`로 클라이언트에서만 읽기
3. **추천 중복** - 같은 카테고리/브랜드 중복 추천 → 프롬프트에 제약 추가
4. **reason 길이** - UI 깨짐 → 15자 제한 + truncate 처리

---

## 테스트 방법

1. https://famous-rolypoly-fcde1b.netlify.app 접속
2. 카카오톡 채팅창에 "여행 가고 싶다" 입력
3. AI가 친구처럼 응답하는지 확인
4. "AI로 분석하고 혜택 추천받기" 클릭
5. 채팅 내용이 반영된 혜택 추천 확인 (여행 → 공항 혜택)
6. 새로고침 후 이전 채팅이 유지되는지 확인
7. "비우기" 클릭 후 새 채팅방이 시작되는지 확인

---

## 다음 개발 시 참고사항

- 카테고리 추가/수정 시 `_shared/claude.ts`와 `services/api.ts` 모두 수정 필요
- Claude 모델: `claude-sonnet-4-20250514`
- 채팅 응답 max_tokens: 256 (짧은 응답 유도)
- 분석 응답 max_tokens: 4096
- 채팅 컨텍스트: 최근 10개 메시지만 사용
