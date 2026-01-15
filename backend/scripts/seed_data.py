#!/usr/bin/env python3
"""
Mock 데이터 생성 및 삽입 스크립트
1년치 카카오페이 결제 내역과 채팅 데이터를 생성합니다.
"""
import os
import sys
import random
from datetime import datetime, timedelta
from pathlib import Path

# 프로젝트 루트를 path에 추가
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

from supabase import create_client

# 가맹점 데이터
MERCHANTS = {
    "식비": [
        ("배달의민족", 15000, 35000),
        ("쿠팡이츠", 18000, 40000),
        ("맥도날드", 8000, 15000),
        ("버거킹", 9000, 18000),
        ("김밥천국", 5000, 12000),
        ("한솥도시락", 6000, 10000),
        ("이마트", 30000, 150000),
        ("홈플러스", 25000, 120000),
        ("GS25", 3000, 15000),
        ("CU", 2000, 12000),
    ],
    "카페": [
        ("스타벅스", 5000, 15000),
        ("투썸플레이스", 5500, 12000),
        ("이디야커피", 3000, 8000),
        ("메가커피", 2500, 6000),
        ("빽다방", 2000, 5000),
    ],
    "교통": [
        ("카카오T택시", 8000, 35000),
        ("서울교통공사", 1500, 3000),
        ("버스", 1500, 2500),
        ("SK에너지", 50000, 100000),
        ("GS칼텍스", 45000, 95000),
    ],
    "쇼핑": [
        ("쿠팡", 15000, 200000),
        ("네이버쇼핑", 10000, 150000),
        ("무신사", 30000, 150000),
        ("올리브영", 15000, 80000),
        ("다이소", 5000, 30000),
    ],
    "구독서비스": [
        ("넷플릭스", 13500, 17000),
        ("유튜브프리미엄", 10900, 14900),
        ("멜론", 10900, 10900),
        ("스포티파이", 10900, 10900),
        ("웨이브", 7900, 13900),
    ],
    "여가": [
        ("CGV", 12000, 18000),
        ("메가박스", 11000, 17000),
        ("롯데시네마", 12000, 18000),
        ("에버랜드", 50000, 70000),
        ("스포애니", 80000, 120000),
    ],
    "의료": [
        ("서울대병원", 20000, 200000),
        ("이비인후과", 10000, 50000),
        ("치과", 30000, 300000),
        ("약국", 5000, 50000),
    ],
    "공과금": [
        ("한국전력", 30000, 150000),
        ("서울시상수도", 10000, 50000),
        ("도시가스", 20000, 100000),
        ("SKT", 50000, 100000),
        ("KT", 45000, 90000),
    ],
}

# 채팅 데이터 템플릿 (미래 소비 의도 포함)
CHAT_TEMPLATES = [
    # 여행 관련
    "다음 달에 일본 여행 가려고 하는데 추천 좀 해줘",
    "오사카 항공권 싸게 파는 데 있어?",
    "여름 휴가 때 제주도 갈까 생각 중이야",
    "해외여행 짐 뭐 챙겨야 해?",

    # 운동/건강 관련
    "헬스장 등록하려고 하는데 어디가 좋아?",
    "필라테스 시작해볼까 하는데 비용이 얼마나 해?",
    "골프 배우고 싶은데 초보자 레슨 추천해줘",
    "요가 매트 사려고 하는데 뭐가 좋아?",

    # 쇼핑/구매 관련
    "에어팟 프로 살까 고민 중이야",
    "겨울 패딩 새로 사야 하는데 추천해줘",
    "노트북 바꾸려고 하는데 맥북이 좋을까?",
    "청소기 새로 사려고 해. 다이슨이 좋대",

    # 구독 서비스 관련
    "넷플릭스 계정 공유 막힌다던데 어떡하지",
    "웨이브 가입할까 고민이야",
    "음악 스트리밍 뭐 써? 멜론 괜찮아?",

    # 이사/주거 관련
    "이사 가려고 하는데 좋은 곳 추천해줘",
    "인테리어 업체 알아보고 있어",
    "가구 새로 사야 하는데 이케아 어때?",

    # 일상 대화
    "오늘 점심 뭐 먹지?",
    "주말에 뭐 해?",
    "요즘 바빠서 힘들어",
    "오늘 날씨 좋다",
    "주말에 영화 보러 갈래?",
]


def generate_payment_data(user_id: str, months: int = 12) -> list[dict]:
    """1년치 결제 데이터 생성"""
    payments = []
    end_date = datetime.now()
    start_date = end_date - timedelta(days=months * 30)

    current_date = start_date

    while current_date <= end_date:
        # 하루에 1-5건의 결제
        daily_transactions = random.randint(1, 5)

        for _ in range(daily_transactions):
            # 카테고리 선택 (가중치 적용)
            category_weights = {
                "식비": 35,
                "카페": 15,
                "교통": 15,
                "쇼핑": 10,
                "구독서비스": 5,
                "여가": 8,
                "의료": 5,
                "공과금": 7,
            }
            category = random.choices(
                list(category_weights.keys()),
                weights=list(category_weights.values()),
            )[0]

            # 가맹점 선택
            merchant_data = random.choice(MERCHANTS[category])
            merchant_name = merchant_data[0]
            min_amount = merchant_data[1]
            max_amount = merchant_data[2]

            # 금액 생성
            amount = random.randint(min_amount, max_amount)

            # 시간 추가 (8시~23시 사이)
            hour = random.randint(8, 23)
            minute = random.randint(0, 59)
            transaction_time = current_date.replace(hour=hour, minute=minute)

            payments.append({
                "user_id": user_id,
                "merchant_name": merchant_name,
                "category": category,
                "amount": amount,
                "payment_method": "카카오페이",
                "transaction_date": transaction_time.isoformat(),
                "description": f"{merchant_name} 결제",
            })

        current_date += timedelta(days=1)

    return payments


def generate_chat_data(user_id: str) -> list[dict]:
    """채팅 데이터 생성 (미래 소비 의도 포함)"""
    chats = []
    now = datetime.now()

    # 최근 30일 내의 채팅 생성
    for i in range(50):  # 50개의 메시지
        days_ago = random.randint(0, 30)
        hours_ago = random.randint(0, 23)
        sent_at = now - timedelta(days=days_ago, hours=hours_ago)

        message = random.choice(CHAT_TEMPLATES)

        chats.append({
            "user_id": user_id,
            "chat_room_id": "main_chat",
            "message_content": message,
            "sender_type": random.choice(["user", "friend"]),
            "sent_at": sent_at.isoformat(),
            "metadata": {"source": "mock_data"},
        })

    return chats


def main():
    """Mock 데이터 생성 및 삽입"""
    print("=" * 60)
    print("Mock Data Generation")
    print("=" * 60)

    # Supabase 클라이언트 생성
    supabase_url = os.getenv("SUPABASE_URL", "https://fvlanbsclsewkfypomlr.supabase.co")
    supabase_key = os.getenv("SUPABASE_KEY")

    if not supabase_key:
        print("Error: SUPABASE_KEY environment variable is required")
        sys.exit(1)

    client = create_client(supabase_url, supabase_key)

    # 1. 테스트 사용자 생성
    print("\n1. Creating test user...")
    try:
        user_response = client.table("users").upsert({
            "email": "test@example.com",
            "name": "테스트 사용자",
        }, on_conflict="email").execute()

        user = user_response.data[0]
        user_id = user["id"]
        print(f"   User created/updated: {user_id}")
    except Exception as e:
        print(f"   Error creating user: {e}")
        sys.exit(1)

    # 2. 기존 데이터 삭제 (선택적)
    print("\n2. Clearing existing data for user...")
    try:
        client.table("payment_history").delete().eq("user_id", user_id).execute()
        client.table("chat_logs").delete().eq("user_id", user_id).execute()
        client.table("card_benefits").delete().eq("user_id", user_id).execute()
        print("   Existing data cleared")
    except Exception as e:
        print(f"   Warning: Could not clear existing data: {e}")

    # 3. 결제 데이터 생성 및 삽입
    print("\n3. Generating payment history (1 year)...")
    payments = generate_payment_data(user_id, months=12)
    print(f"   Generated {len(payments)} payment records")

    print("   Inserting payment data...")
    # 배치로 삽입 (100개씩)
    batch_size = 100
    for i in range(0, len(payments), batch_size):
        batch = payments[i:i + batch_size]
        try:
            client.table("payment_history").insert(batch).execute()
            print(f"   Inserted batch {i // batch_size + 1}/{(len(payments) - 1) // batch_size + 1}")
        except Exception as e:
            print(f"   Error inserting batch: {e}")

    # 4. 채팅 데이터 생성 및 삽입
    print("\n4. Generating chat logs...")
    chats = generate_chat_data(user_id)
    print(f"   Generated {len(chats)} chat messages")

    print("   Inserting chat data...")
    try:
        client.table("chat_logs").insert(chats).execute()
        print("   Chat data inserted")
    except Exception as e:
        print(f"   Error inserting chat data: {e}")

    # 5. 요약
    print("\n" + "=" * 60)
    print("Summary")
    print("=" * 60)
    print(f"User ID: {user_id}")
    print(f"Email: test@example.com")
    print(f"Payment records: {len(payments)}")
    print(f"Chat messages: {len(chats)}")
    print("\n✅ Mock data generation complete!")
    print("\nYou can now test the API with this user_id.")


if __name__ == "__main__":
    main()
