"""Report 관련 Pydantic 스키마"""
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class CategoryBreakdownItem(BaseModel):
    """카테고리별 비중 항목"""

    category: str
    percentage: float = Field(..., ge=0, le=100)
    amount: int


class CategoryBreakdown(BaseModel):
    """카테고리별 비중 비교"""

    past_pattern: list[CategoryBreakdownItem]
    new_pattern: list[CategoryBreakdownItem]


class MonthlyTrendItem(BaseModel):
    """월별 트렌드 항목"""

    month: str  # "2025-01"
    total_spending: int
    savings: int
    top_category: str


class AnnualReportRequest(BaseModel):
    """연간 리포트 요청 스키마"""

    user_id: UUID
    year: Optional[int] = None  # None이면 최근 12개월


class AnnualReportResponse(BaseModel):
    """연간 리포트 응답 스키마"""

    user_id: UUID
    period: str  # "2025" or "2024-01 ~ 2025-01"
    category_breakdown: CategoryBreakdown
    monthly_trend: list[MonthlyTrendItem]
    total_savings_achieved: int
