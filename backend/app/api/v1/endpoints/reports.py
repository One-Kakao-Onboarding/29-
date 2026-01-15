"""리포트 API 엔드포인트"""
from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query

from app.schemas.report import (
    AnnualReportResponse,
    CategoryBreakdown,
    CategoryBreakdownItem,
    MonthlyTrendItem,
)
from app.services.supabase_service import get_supabase_service
from app.utils.exceptions import AppException

router = APIRouter()


@router.get("/reports/annual", response_model=AnnualReportResponse)
async def get_annual_report(
    user_id: UUID = Query(..., description="사용자 ID"),
    year: Optional[int] = Query(None, description="연도 (기본값: 최근 12개월)"),
) -> AnnualReportResponse:
    """
    연간 소비 리포트를 조회합니다.

    - 과거 패턴과 새로운 패턴의 카테고리별 비중 비교
    - 월별 트렌드
    - 총 절감액
    """
    db = get_supabase_service()

    try:
        # 1. 사용자 확인
        user = await db.get_user(user_id)

        # 2. 결제 내역 조회
        payments = await db.get_payment_history(user_id, months=12)

        if not payments:
            # 데이터가 없는 경우 빈 리포트 반환
            return AnnualReportResponse(
                user_id=user_id,
                period=str(year) if year else f"{datetime.now().year}",
                category_breakdown=CategoryBreakdown(
                    past_pattern=[],
                    new_pattern=[],
                ),
                monthly_trend=[],
                total_savings_achieved=0,
            )

        # 3. 카테고리별 분석
        category_summary = await db.get_payment_summary_by_category(user_id, months=12)

        # 과거 패턴 (전체 기간)
        past_pattern = [
            CategoryBreakdownItem(
                category=item["category"],
                percentage=item["percentage"],
                amount=item["amount"],
            )
            for item in category_summary[:10]
        ]

        # 새로운 패턴 (최근 3개월 - 더 최신 데이터 반영)
        recent_summary = await db.get_payment_summary_by_category(user_id, months=3)
        new_pattern = [
            CategoryBreakdownItem(
                category=item["category"],
                percentage=item["percentage"],
                amount=item["amount"],
            )
            for item in recent_summary[:10]
        ]

        # 4. 월별 트렌드 계산
        monthly_data: dict[str, dict] = {}

        for payment in payments:
            date = datetime.fromisoformat(payment["transaction_date"].replace("Z", "+00:00"))
            month_key = date.strftime("%Y-%m")

            if month_key not in monthly_data:
                monthly_data[month_key] = {
                    "total_spending": 0,
                    "categories": {},
                }

            monthly_data[month_key]["total_spending"] += payment["amount"]

            category = payment["category"]
            if category not in monthly_data[month_key]["categories"]:
                monthly_data[month_key]["categories"][category] = 0
            monthly_data[month_key]["categories"][category] += payment["amount"]

        monthly_trend = []
        for month, data in sorted(monthly_data.items()):
            # 가장 많이 쓴 카테고리 찾기
            top_category = max(
                data["categories"].items(),
                key=lambda x: x[1],
                default=("없음", 0),
            )[0]

            # 예상 절감액 계산 (간단한 추정: 총 지출의 3%)
            savings = int(data["total_spending"] * 0.03)

            monthly_trend.append(
                MonthlyTrendItem(
                    month=month,
                    total_spending=data["total_spending"],
                    savings=savings,
                    top_category=top_category,
                )
            )

        # 5. 총 절감액 계산
        total_savings = sum(item.savings for item in monthly_trend)

        # 6. 기간 문자열 생성
        if year:
            period = str(year)
        elif monthly_trend:
            first_month = monthly_trend[0].month
            last_month = monthly_trend[-1].month
            period = f"{first_month} ~ {last_month}"
        else:
            period = str(datetime.now().year)

        return AnnualReportResponse(
            user_id=user_id,
            period=period,
            category_breakdown=CategoryBreakdown(
                past_pattern=past_pattern,
                new_pattern=new_pattern,
            ),
            monthly_trend=monthly_trend,
            total_savings_achieved=total_savings,
        )

    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
