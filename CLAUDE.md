# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Dynamic Custom Card - A service that analyzes KakaoPay payment history and chat data to recommend customized card benefits using Claude AI.

## Production URLs

- **Frontend:** https://famous-rolypoly-fcde1b.netlify.app
- **Backend API:** https://fvlanbsclsewkfypomlr.supabase.co/functions/v1

## Development Commands

### Backend (FastAPI - Local Reference)
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000  # Run server
pytest tests/ -v                                  # Run tests
```

### Frontend (Next.js)
```bash
cd "frontend/orott-ai-card (1)"
pnpm install
pnpm dev      # Development server
pnpm build    # Production build
pnpm lint     # Lint
```

### Supabase Edge Functions (Production)
```bash
source ~/.claude/deploy-config.sh                 # Load auth
supabase functions deploy analyze-and-recommend --project-ref fvlanbsclsewkfypomlr
supabase functions deploy benefits-confirm --project-ref fvlanbsclsewkfypomlr
supabase functions deploy reports-annual --project-ref fvlanbsclsewkfypomlr
supabase functions deploy chat --project-ref fvlanbsclsewkfypomlr
```

## Architecture

```
[사용자 채팅 입력]
       ↓
[POST /chat] ─────────────────────────────────┐
       ↓                                      │
[사용자 메시지 DB 저장]                        │
       ↓                                      │
[Claude API - 친구 대화]                       │
       ↓                                      │
[AI 응답 DB 저장]                              │
       ↓                                      │
[응답 반환 → UI 표시]                          │
                                              │
[AI로 분석하고 혜택 추천받기 버튼 클릭]          │
       ↓                                      │
[POST /analyze-and-recommend]                 │
       ↓                                      │
[chat_room_id로 DB에서 채팅 조회] ←────────────┘
       ↓
[결제내역 + 채팅내역 → Claude 분석]
       ↓
[맞춤 혜택 5개 추천]
```

**Production Stack:**
- Frontend: Next.js 16 with React 19, Three.js for 3D card visualization
- Backend: Supabase Edge Functions (TypeScript/Deno) - deployed
- Database: Supabase PostgreSQL (project: `fvlanbsclsewkfypomlr`, region: Seoul)
- AI: Claude Sonnet (claude-sonnet-4-20250514) via Anthropic API

**Local Reference:** FastAPI backend in `backend/app/` mirrors Edge Function logic.

## Key Files

### Edge Functions (Production)
- `backend/supabase/functions/analyze-and-recommend/index.ts` - Analyzes spending + recommends benefits
- `backend/supabase/functions/benefits-confirm/index.ts` - Saves user benefit selections
- `backend/supabase/functions/reports-annual/index.ts` - Returns annual spending report
- `backend/supabase/functions/chat/index.ts` - AI chat with Claude (친구처럼 대화)
- `backend/supabase/functions/_shared/claude.ts` - Claude API utility (analyzeAndRecommend, generateChatResponse)
- `backend/supabase/functions/_shared/supabase.ts` - Database queries (getChatLogs, saveChatMessage, etc.)

### Frontend
- `frontend/orott-ai-card (1)/app/page.tsx` - Main page with AI chat & benefits integration
- `frontend/orott-ai-card (1)/services/api.ts` - API client (sendChatMessage, analyzeAndRecommend, etc.)
- `frontend/orott-ai-card (1)/services/types.ts` - TypeScript interfaces
- `frontend/orott-ai-card (1)/components/card-3d.tsx` - 3D card visualization (Three.js)
- `frontend/orott-ai-card (1)/components/context-simulator.tsx` - Chat input simulator

### Database Scripts
- `backend/scripts/init_schema.sql` - Schema definition
- `backend/scripts/seed_data.py` - Mock data generator

## API Endpoints

Base URL: `https://fvlanbsclsewkfypomlr.supabase.co/functions/v1`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/chat` | POST | AI chat - saves messages & returns Claude response |
| `/analyze-and-recommend` | POST | Analyze spending + chat history, recommend benefits |
| `/benefits-confirm` | POST | Save selected benefits |
| `/reports-annual` | GET | Get annual spending report |

All requests require: `Authorization: Bearer <ANON_KEY>`

### Chat API Example
```bash
curl -X POST https://fvlanbsclsewkfypomlr.supabase.co/functions/v1/chat \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"user_id":"b0079fad-191b-46f9-80b7-2125a2e7d288","chat_room_id":"test-room","message":"여행 가고 싶다"}'
```

## Test Data

- **Test User ID:** `b0079fad-191b-46f9-80b7-2125a2e7d288`
- **Mock Data:** 1,093 transactions + 50 chat logs (1 year)

## Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://fvlanbsclsewkfypomlr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
```

### Backend (.env)
```
SUPABASE_URL=https://fvlanbsclsewkfypomlr.supabase.co
SUPABASE_KEY=<service_role_key>
ANTHROPIC_API_KEY=<api_key>
```

## Fixed Categories

The card supports 10 fixed benefit categories (must stay synchronized between frontend and backend):
카페, 영화관, 배달, OTT, 교통, 편의점, 주유, 쇼핑, 공항, 마트

## Testing the Full Flow

1. Visit https://famous-rolypoly-fcde1b.netlify.app
2. Type in KakaoTalk chat (e.g., "여행 가고 싶다")
3. AI should respond naturally as a 20대 friend
4. Click "AI로 분석하고 혜택 추천받기"
5. Recommendations should reflect chat content (travel → airport benefits)
6. Check Supabase Dashboard > Table Editor > chat_logs for saved messages
