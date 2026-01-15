# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**오롯 (Orott) - AI Dynamic Custom Card**
카카오페이 결제 내역과 카카오톡 채팅 데이터를 AI로 분석하여 맞춤형 카드 혜택을 추천하는 서비스

**서비스 컨셉:** "카드는 그대로, 혜택은 매년 새롭게" - 원클릭 혜택 리모델링

## Production URLs

- **Frontend:** https://orott-ai-card.pages.dev (Cloudflare Pages)
- **Backend API:** https://fvlanbsclsewkfypomlr.supabase.co/functions/v1
- **Supabase Dashboard:** https://supabase.com/dashboard/project/fvlanbsclsewkfypomlr

---

## 구현된 기능 목록

### 1. AI 채팅 (카카오톡 시뮬레이터)
- 사용자가 메시지 입력 → Claude AI가 20대 친구처럼 응답
- 모든 채팅은 DB(`chat_logs` 테이블)에 자동 저장
- `chatRoomId`는 localStorage에 저장되어 새로고침해도 이전 대화 유지
- "비우기" 버튼 클릭 시 새 채팅방 생성 (이전 대화 초기화)
- **Supabase Realtime** 구독으로 다른 사용자 메시지도 실시간 표시
- 한글 IME 버퍼링 버그 수정됨 (`onCompositionStart/End` 처리)

### 2. AI 분석 & 혜택 추천 (핵심 기능)
- "맞춤 혜택 추천받기" 버튼 클릭 시 실행
- **채팅 데이터 우선 분석** - 결제 내역보다 채팅에서 감지된 의도를 더 중요하게 반영
- **정확히 3개 혜택만 추천** (이전 5개에서 변경)
- 추천 우선순위:
  1. 채팅에서 감지된 의도 기반 (1~2개) - 예: "여행" 언급 → 공항 혜택
  2. 과거 소비 패턴 기반 (나머지)
- 추천 이유는 15자 이내로 짧게 표시 (채팅 기반: 💬, 결제 기반: 💳)
- **현실적 혜택 한도:** 3개 혜택 합계 월 9,000~15,000원

### 3. 혜택 교체
- 추천된 혜택 카드 클릭 시 드롭다운 표시
- 대체 혜택 목록에서 선택하여 교체 가능

### 4. 연간 소비 리포트
- 연간 소비 패턴 분석 리포트 표시
- **위트있는 라이프스타일 유형:**
  - 📺 집순이 소비자 - "이동이 적고 콘텐츠를 즐기는 라이프스타일"
  - 🛒 살림 고수 - "알뜰하게 장보는 현명한 소비자"
  - ☕ 카페 단골손님 - "커피 한 잔의 여유를 아는 사람"
  - ✈️ 여행 덕후 - "새로운 곳을 탐험하는 게 행복인 사람"
  - 🍕 집콕 미식가, 👗 패션 피플, 🏪 편세권 주민, 🚇 바쁜 일상러, 🚗 도로 위 자유인, 🎬 영화관 단골
- 레이더 차트로 이전/현재 소비 패턴 비교
- "원클릭 혜택 리모델링" 버튼

### 5. 3D 카드 시각화
- Three.js로 구현된 3D 카드 렌더링
- 선택된 혜택 카테고리 색상이 카드에 반영

---

## 채팅 키워드 → 혜택 매핑

AI 분석 시 채팅에서 다음 키워드를 감지하여 혜택 추천:

| 채팅 키워드 | 추천 혜택 |
|------------|----------|
| 여행, 비행기, 해외 | 공항 |
| 영화, CGV, 메가박스 | 영화관 |
| 넷플릭스, 디즈니, 티빙, 드라마, 정주행 | OTT |
| 커피, 스타벅스, 카페 | 카페 |
| 배달, 배민, 쿠팡잇츠, 야식 | 배달 |
| 쇼핑, 무신사, 옷, 패션 | 쇼핑 |
| 운전, 주유, 기름 | 주유 |
| 출퇴근, 지하철, 버스 | 교통 |

---

## 10개 고정 혜택 카테고리 및 현실적 한도

| 카테고리 | 아이콘 | 브랜드 | 할인율 | 월 한도 |
|---------|-------|-------|--------|--------|
| 카페 | ☕ | 스타벅스, 투썸 | 10% | 3,000원 |
| 영화관 | 🎥 | CGV, 메가박스, 롯데시네마 | 6,000원 정액 | 6,000원 |
| 배달 | 🛵 | 배달의민족, 쿠팡잇츠 | 5% | 3,000원 |
| OTT | 🎬 | 넷플릭스, 디즈니+, 티빙 | 5,000원 정액 | 5,000원 |
| 교통 | 🚇 | 대중교통, 지하철, 버스 | 10% | 5,000원 |
| 편의점 | 🏪 | CU, GS25, 세븐일레븐 | 5% | 2,000원 |
| 주유 | ⛽ | SK, S-oil, 현대오일뱅크 | L당 60원 | 3,000원 |
| 쇼핑 | 👕 | 무신사, 지그재그, 29cm | 5% | 3,000원 |
| 공항 | ✈️ | 공항라운지 | 5,000원 정액 | 5,000원 |
| 마트 | 🛒 | 이마트, 롯데마트 | 5% | 3,000원 |

**중요:**
- 3개 혜택 합계: 9,000~15,000원 범위
- 백엔드에서 AI 응답 후 monthly_limit 강제 보정 로직 있음 (`claude.ts`)

---

## 주요 파일 구조

### Backend (Supabase Edge Functions)
```
backend/supabase/functions/
├── _shared/
│   ├── claude.ts          # Claude API 유틸리티
│   │   ├── CHAT_FRIEND_PROMPT   # 친구 대화용 시스템 프롬프트
│   │   ├── SYSTEM_PROMPT        # 분석용 시스템 프롬프트 (채팅 우선 분석)
│   │   ├── CATEGORY_LIMITS      # 카테고리별 월 한도 (강제 보정용)
│   │   ├── analyzeAndRecommend()
│   │   └── generateChatResponse()
│   ├── supabase.ts        # DB 쿼리 함수
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
│       ├── fallbackBenefits     # 데모용 3개 혜택 (총 11,000원)
│       ├── handleSendMessage()  # 채팅 전송
│       ├── handleAnalyze()      # AI 분석 요청
│       ├── handleClearChat()    # 채팅 초기화
│       └── subscribeToGlobalChat() # Realtime 구독
├── services/
│   ├── api.ts             # API 클라이언트
│   │   ├── CATEGORY_ICONS, CATEGORY_COLORS
│   │   ├── transformToBenefit()  # reason 15자 truncate
│   │   └── formatDiscount()      # 천원/만원 단위 표시
│   ├── supabase.ts        # Supabase Realtime 클라이언트 (NEW)
│   │   └── subscribeToGlobalChat()
│   └── types.ts           # TypeScript 인터페이스
├── components/
│   ├── context-simulator.tsx  # 카카오톡/페이 시뮬레이터
│   ├── benefit-card.tsx       # 혜택 카드 UI
│   ├── card-3d.tsx            # Three.js 3D 카드
│   ├── oroft-service.tsx      # 혜택 추천 섹션
│   └── consumption-report.tsx # 연간 리포트 (라이프스타일 유형)
├── next.config.mjs        # output: 'export' (Cloudflare Pages용)
└── .env.local             # 환경변수
```

---

## 개발 명령어

### Frontend
```bash
cd "frontend/orott-ai-card (1)"
npm install
npm run dev      # 개발 서버 (localhost:3000)
npm run build    # 프로덕션 빌드
```

### Backend (Edge Functions 배포)
```bash
cd backend
source ~/.claude/deploy-config.sh
supabase functions deploy analyze-and-recommend --project-ref fvlanbsclsewkfypomlr
supabase functions deploy chat --project-ref fvlanbsclsewkfypomlr
supabase functions deploy chat-history --project-ref fvlanbsclsewkfypomlr
```

### Frontend 배포 (Cloudflare Pages)
```bash
cd "frontend/orott-ai-card (1)"
npm run build
npx wrangler pages deploy out --project-name=orott-ai-card
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

## 해결된 이슈

1. **한글 IME 버퍼링** - 채팅 입력 후 마지막 글자 남는 문제 → `onCompositionStart/End` 처리
2. **SSR hydration** - localStorage 읽기 실패 → `useEffect`로 클라이언트에서만 읽기
3. **추천 중복** - 같은 카테고리/브랜드 중복 추천 → 프롬프트에 제약 추가
4. **reason 길이** - UI 깨짐 → 15자 제한 + truncate 처리
5. **비현실적 혜택 금액** - 월 50만원 한도 등 → 현실적 한도로 강제 보정
6. **채팅 응답 중복** - Realtime + API 응답 중복 → 현재 사용자 메시지 Realtime에서 제외
7. **혜택 개수** - 5개 → 3개로 변경

---

## 테스트 방법

1. https://orott-ai-card.pages.dev 접속
2. 카카오톡 채팅창에 "여행 가고 싶다" 입력
3. AI가 친구처럼 응답하는지 확인
4. "맞춤 혜택 추천받기" 클릭
5. **3개 혜택**이 추천되는지 확인
6. 채팅 내용이 반영된 혜택 추천 확인 (여행 → 공항 혜택, reason: "여행 계획 언급")
7. 혜택 월 한도가 현실적인지 확인 (개별 2,000~6,000원, 총합 9,000~15,000원)
8. 소비 리포트에서 라이프스타일 유형 확인 (예: "집순이 소비자")

---

## 다음 개발 시 참고사항

- **혜택 개수:** 정확히 3개만 추천 (5개 아님)
- **채팅 우선:** AI 분석 시 채팅 데이터가 결제 데이터보다 우선
- **월 한도 보정:** `claude.ts`의 `CATEGORY_LIMITS`에서 강제 보정
- 카테고리 추가/수정 시 `_shared/claude.ts`와 `services/api.ts` 모두 수정 필요
- Claude 모델: `claude-sonnet-4-20250514`
- 채팅 응답 max_tokens: 256 (짧은 응답 유도)
- 분석 응답 max_tokens: 4096
- Frontend 배포: Cloudflare Pages (`npx wrangler pages deploy`)
- Backend 배포: Supabase Edge Functions (`supabase functions deploy`)
