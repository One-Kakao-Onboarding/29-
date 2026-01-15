# AI Dynamic Custom Card - 프로젝트 인수인계

## 📋 프로젝트 개요
카카오페이 결제 내역과 채팅 데이터를 분석하여 맞춤형 카드 혜택을 추천하는 서비스

## ✅ 완료된 작업

### 1. Supabase 데이터베이스 (완료)
- **프로젝트**: 29jo (`fvlanbsclsewkfypomlr`)
- **리전**: Northeast Asia (Seoul)
- **테이블**: users, payment_history, chat_logs, benefit_options, card_benefits, benefit_history
- **Mock 데이터**: 1년치 결제 내역 (1,093건) + 채팅 로그 (50건)

### 2. Supabase Edge Functions (배포 완료)
| 함수명 | 메서드 | 용도 |
|--------|--------|------|
| `analyze-and-recommend` | POST | Claude API로 소비 분석 및 혜택 추천 |
| `benefits-confirm` | POST | 사용자가 선택한 혜택 저장 |
| `reports-annual` | GET | 연간 소비 리포트 조회 |

### 3. 테스트 사용자
- **User ID**: `b0079fad-191b-46f9-80b7-2125a2e7d288`
- **Email**: test@example.com

---

## 🔜 다음 작업: 프론트엔드 연동

### 프론트엔드가 `frontend/` 디렉토리에 추가되면:

1. **환경변수 설정** (`frontend/.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL=https://fvlanbsclsewkfypomlr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2bGFuYnNjbHNld2tmeXBvbWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjQzNzIsImV4cCI6MjA4Mzk0MDM3Mn0.yyEYHMWxwa-ksGmcg6gWc5c-4PoSOCTbHvujt8yH4vQ
```

2. **API 호출 코드** 추가
```typescript
// lib/api.ts
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function analyzeAndRecommend(userId: string, chatRoomId?: string) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/analyze-and-recommend`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${ANON_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ user_id: userId, chat_room_id: chatRoomId }),
  });
  return response.json();
}

export async function confirmBenefits(userId: string, benefits: Array<{
  slot_number: number;
  benefit_option_id: string;
  custom_discount_rate?: number;
  custom_monthly_limit?: number;
}>) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/benefits-confirm`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${ANON_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ user_id: userId, benefits }),
  });
  return response.json();
}

export async function getAnnualReport(userId: string, year?: number) {
  const params = new URLSearchParams({ user_id: userId });
  if (year) params.append("year", year.toString());

  const response = await fetch(`${SUPABASE_URL}/functions/v1/reports-annual?${params}`, {
    headers: { "Authorization": `Bearer ${ANON_KEY}` },
  });
  return response.json();
}
```

3. **Supabase 클라이언트 설정** (선택사항)
```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

---

## 🔑 인증 정보

### Supabase
- **URL**: `https://fvlanbsclsewkfypomlr.supabase.co`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2bGFuYnNjbHNld2tmeXBvbWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjQzNzIsImV4cCI6MjA4Mzk0MDM3Mn0.yyEYHMWxwa-ksGmcg6gWc5c-4PoSOCTbHvujt8yH4vQ`
- **Service Role Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2bGFuYnNjbHNld2tmeXBvbWxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODM2NDM3MiwiZXhwIjoyMDgzOTQwMzcyfQ.ZOSQgSXMGeGyrPxDFYoTALMlNId9wlzzqygnZZIPFnw`

### CLI 인증
- **Supabase CLI**: `source ~/.claude/deploy-config.sh`로 인증 로드
- **Netlify CLI**: 로그인됨 (JONGCHAN BAE)

---

## 📁 프로젝트 구조

```
29-/
├── CLAUDE.md              # 이 인수인계 문서
├── backend/
│   ├── app/               # FastAPI 백엔드 (로컬용, 참고용)
│   ├── supabase/
│   │   └── functions/     # Edge Functions (배포됨)
│   │       ├── _shared/   # 공유 유틸리티
│   │       ├── analyze-and-recommend/
│   │       ├── benefits-confirm/
│   │       └── reports-annual/
│   └── scripts/
│       ├── init_schema.sql
│       └── seed_data.py
└── frontend/              # (v0.dev에서 생성한 Next.js - 추가 예정)
```

---

## 📝 API 응답 형식

### POST /functions/v1/analyze-and-recommend
**Request:**
```json
{
  "user_id": "b0079fad-191b-46f9-80b7-2125a2e7d288",
  "chat_room_id": "optional",
  "analysis_period_months": 12
}
```

**Response:**
```json
{
  "user_id": "uuid",
  "analysis_summary": {
    "total_spending": 35000000,
    "top_categories": [{"category": "식비", "amount": 8900000, "percentage": 25.6}],
    "detected_intentions": ["해외여행 계획", "헬스장 등록 의향"]
  },
  "current_benefits": [...],
  "recommended_benefits": [
    {
      "slot_number": 1,
      "benefit_option_id": "uuid",
      "category": "식비",
      "benefit_name": "배달앱 10% 할인",
      "reason": "배달앱 사용이 많음"
    }
  ],
  "comparison": {
    "expected_monthly_savings": { "current": 45000, "recommended": 78000, "improvement": 33000 }
  }
}
```

### POST /functions/v1/benefits-confirm
**Request:**
```json
{
  "user_id": "uuid",
  "benefits": [
    { "slot_number": 1, "benefit_option_id": "uuid" }
  ]
}
```

### GET /functions/v1/reports-annual?user_id=uuid
카테고리별 소비 비중, 월별 트렌드, 총 절감액 반환

---

## ⚠️ 주의사항

1. **CORS**: Edge Functions에 CORS 허용됨 (`*`)
2. **인증**: 모든 API 호출에 `Authorization: Bearer ANON_KEY` 헤더 필요
3. **테스트**: 테스트 사용자 ID `b0079fad-191b-46f9-80b7-2125a2e7d288` 사용

---

## 🚀 다음 세션에서 할 일

프론트엔드(`frontend/`)가 추가되면:
1. `frontend/.env.local` 파일 생성 및 환경변수 설정
2. API 호출 유틸리티 (`lib/api.ts`) 생성
3. 컴포넌트에서 API 연동
4. Netlify 배포 설정
