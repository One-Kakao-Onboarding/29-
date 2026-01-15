-- AI Dynamic Custom Card - Supabase Schema
-- Project: 29jo (fvlanbsclsewkfypomlr)

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. users: 사용자 정보
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. payment_history: 카카오페이 결제 내역 (1년치)
-- =====================================================
CREATE TABLE IF NOT EXISTS payment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    merchant_name VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL,
    amount INTEGER NOT NULL,
    payment_method VARCHAR(50) DEFAULT '카카오페이',
    transaction_date TIMESTAMPTZ NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. chat_logs: 채팅 로그 (비정형)
-- =====================================================
CREATE TABLE IF NOT EXISTS chat_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    chat_room_id VARCHAR(100),
    message_content TEXT NOT NULL,
    sender_type VARCHAR(20) DEFAULT 'user',
    sent_at TIMESTAMPTZ NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. benefit_options: 혜택 마스터 데이터
-- =====================================================
CREATE TABLE IF NOT EXISTS benefit_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(50) NOT NULL,
    benefit_name VARCHAR(200) NOT NULL,
    benefit_type VARCHAR(50) NOT NULL,
    max_discount_rate DECIMAL(5,2),
    max_monthly_limit INTEGER,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. card_benefits: 사용자의 현재 활성 혜택
-- =====================================================
CREATE TABLE IF NOT EXISTS card_benefits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    benefit_option_id UUID REFERENCES benefit_options(id),
    custom_discount_rate DECIMAL(5,2),
    custom_monthly_limit INTEGER,
    slot_number INTEGER NOT NULL CHECK (slot_number BETWEEN 1 AND 5),
    is_active BOOLEAN DEFAULT TRUE,
    activated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, slot_number)
);

-- =====================================================
-- 6. benefit_history: 혜택 변경 이력
-- =====================================================
CREATE TABLE IF NOT EXISTS benefit_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(20) NOT NULL,
    old_benefits JSONB,
    new_benefits JSONB,
    recommendation_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Indexes for performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_payment_history_user_date ON payment_history(user_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_payment_history_category ON payment_history(category);
CREATE INDEX IF NOT EXISTS idx_chat_logs_user ON chat_logs(user_id, sent_at);
CREATE INDEX IF NOT EXISTS idx_card_benefits_user ON card_benefits(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_benefit_history_user ON benefit_history(user_id, created_at);

-- =====================================================
-- Insert initial benefit_options (마스터 데이터)
-- =====================================================
INSERT INTO benefit_options (category, benefit_name, benefit_type, max_discount_rate, max_monthly_limit, description) VALUES
-- 식비 카테고리
('식비', '음식점 5% 캐시백', 'cashback', 5.00, 30000, '전국 음식점에서 결제 시 5% 캐시백'),
('식비', '배달앱 10% 할인', 'discount', 10.00, 20000, '배달의민족, 쿠팡이츠 등 배달앱 10% 할인'),
('식비', '마트/슈퍼 3% 적립', 'points', 3.00, 15000, '대형마트, 슈퍼마켓에서 3% 포인트 적립'),

-- 카페 카테고리
('카페', '스타벅스 20% 할인', 'discount', 20.00, 10000, '스타벅스 전 메뉴 20% 할인'),
('카페', '카페 전체 10% 캐시백', 'cashback', 10.00, 15000, '전국 카페에서 10% 캐시백'),

-- 교통 카테고리
('교통', '대중교통 10% 할인', 'discount', 10.00, 20000, '지하철, 버스 등 대중교통 10% 할인'),
('교통', '택시 15% 캐시백', 'cashback', 15.00, 25000, '카카오T, 우버 등 택시앱 15% 캐시백'),
('교통', '주유소 5% 할인', 'discount', 5.00, 30000, '전국 주유소에서 5% 할인'),

-- 쇼핑 카테고리
('쇼핑', '온라인쇼핑 5% 캐시백', 'cashback', 5.00, 50000, '쿠팡, 네이버쇼핑 등 온라인몰 5% 캐시백'),
('쇼핑', '백화점 3% 적립', 'points', 3.00, 30000, '전국 백화점에서 3% 포인트 적립'),
('쇼핑', '편의점 10% 할인', 'discount', 10.00, 10000, 'GS25, CU, 세븐일레븐 10% 할인'),

-- 구독서비스 카테고리
('구독서비스', '넷플릭스 50% 캐시백', 'cashback', 50.00, 10000, '넷플릭스 결제 시 50% 캐시백'),
('구독서비스', 'OTT 전체 30% 할인', 'discount', 30.00, 15000, '넷플릭스, 왓챠, 웨이브 등 30% 할인'),
('구독서비스', '음악 스트리밍 100% 캐시백', 'cashback', 100.00, 12000, '멜론, 스포티파이 등 100% 캐시백'),

-- 여가 카테고리
('여가', '영화관 50% 할인', 'discount', 50.00, 20000, 'CGV, 메가박스, 롯데시네마 50% 할인'),
('여가', '테마파크 30% 할인', 'discount', 30.00, 50000, '에버랜드, 롯데월드 등 30% 할인'),
('여가', '헬스장 20% 캐시백', 'cashback', 20.00, 30000, '전국 피트니스센터 20% 캐시백'),

-- 해외결제 카테고리
('해외결제', '해외 가맹점 5% 캐시백', 'cashback', 5.00, 50000, '해외 온라인/오프라인 결제 5% 캐시백'),
('해외결제', '면세점 10% 할인', 'discount', 10.00, 100000, '인천공항 면세점 10% 할인'),

-- 의료 카테고리
('의료', '병원비 5% 캐시백', 'cashback', 5.00, 30000, '병원, 의원 결제 시 5% 캐시백'),
('의료', '약국 10% 할인', 'discount', 10.00, 20000, '전국 약국에서 10% 할인'),

-- 공과금 카테고리
('공과금', '공과금 자동이체 2% 캐시백', 'cashback', 2.00, 10000, '전기, 가스, 수도 등 공과금 2% 캐시백'),
('공과금', '통신비 5% 할인', 'discount', 5.00, 5000, 'SKT, KT, LGU+ 통신비 5% 할인')

ON CONFLICT DO NOTHING;
