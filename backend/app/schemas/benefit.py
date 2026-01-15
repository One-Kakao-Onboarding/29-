"""Benefit 관련 Pydantic 스키마"""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class BenefitOptionBase(BaseModel):
    """혜택 옵션 기본 스키마"""

    category: str = Field(..., max_length=50)
    benefit_name: str = Field(..., max_length=200)
    benefit_type: str = Field(..., max_length=50)  # discount, cashback, points
    max_discount_rate: Optional[float] = Field(None, ge=0, le=100)
    max_monthly_limit: Optional[int] = Field(None, gt=0)
    description: Optional[str] = None
    is_active: bool = True


class BenefitOptionResponse(BenefitOptionBase):
    """혜택 옵션 응답 스키마"""

    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class CardBenefitBase(BaseModel):
    """카드 혜택 기본 스키마"""

    benefit_option_id: UUID
    custom_discount_rate: Optional[float] = Field(None, ge=0, le=100)
    custom_monthly_limit: Optional[int] = Field(None, gt=0)
    slot_number: int = Field(..., ge=1, le=5)
    is_active: bool = True


class CardBenefitCreate(CardBenefitBase):
    """카드 혜택 생성 스키마"""

    user_id: UUID


class CardBenefitResponse(CardBenefitBase):
    """카드 혜택 응답 스키마"""

    id: UUID
    user_id: UUID
    activated_at: datetime
    expires_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class CardBenefitWithDetails(CardBenefitResponse):
    """상세 정보가 포함된 카드 혜택 응답"""

    benefit_option: Optional[BenefitOptionResponse] = None


class RecommendedBenefit(BaseModel):
    """추천 혜택 스키마"""

    slot_number: int = Field(..., ge=1, le=5)
    benefit_option_id: UUID
    category: str
    benefit_name: str
    benefit_type: str
    discount_rate: float
    monthly_limit: int
    reason: str  # 추천 이유


class BenefitComparisonSavings(BaseModel):
    """혜택 비교 예상 절감액"""

    current: int
    recommended: int
    improvement: int


class BenefitComparison(BaseModel):
    """혜택 비교 결과"""

    expected_monthly_savings: BenefitComparisonSavings


class AnalyzeRequest(BaseModel):
    """분석 및 추천 요청 스키마"""

    user_id: UUID
    chat_room_id: Optional[str] = None
    analysis_period_months: int = Field(default=12, ge=1, le=24)


class DetectedIntention(BaseModel):
    """감지된 소비 의도"""

    intention: str
    confidence: float = Field(..., ge=0, le=1)
    source: str  # payment_history, chat_logs


class AnalysisResult(BaseModel):
    """분석 결과 요약"""

    total_spending: int
    top_categories: list[dict]
    detected_intentions: list[str]


class AnalyzeResponse(BaseModel):
    """분석 및 추천 응답 스키마"""

    user_id: UUID
    analysis_summary: AnalysisResult
    current_benefits: list[CardBenefitWithDetails]
    recommended_benefits: list[RecommendedBenefit]
    comparison: BenefitComparison


class BenefitConfirmItem(BaseModel):
    """확정할 혜택 항목"""

    slot_number: int = Field(..., ge=1, le=5)
    benefit_option_id: UUID
    custom_discount_rate: Optional[float] = Field(None, ge=0, le=100)
    custom_monthly_limit: Optional[int] = Field(None, gt=0)


class BenefitConfirmRequest(BaseModel):
    """혜택 확정 요청 스키마"""

    user_id: UUID
    benefits: list[BenefitConfirmItem] = Field(..., min_length=1, max_length=5)


class BenefitConfirmResponse(BaseModel):
    """혜택 확정 응답 스키마"""

    success: bool
    confirmed_benefits: list[CardBenefitResponse]
    effective_from: datetime
