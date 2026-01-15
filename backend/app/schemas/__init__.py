"""Pydantic 스키마 모듈"""
from app.schemas.user import UserBase, UserCreate, UserResponse
from app.schemas.payment import (
    PaymentHistoryBase,
    PaymentHistoryCreate,
    PaymentHistoryResponse,
    CategorySummary,
    PaymentAnalysisSummary,
    ChatLogBase,
    ChatLogCreate,
    ChatLogResponse,
)
from app.schemas.benefit import (
    BenefitOptionBase,
    BenefitOptionResponse,
    CardBenefitBase,
    CardBenefitCreate,
    CardBenefitResponse,
    CardBenefitWithDetails,
    RecommendedBenefit,
    BenefitComparison,
    BenefitComparisonSavings,
    AnalyzeRequest,
    AnalyzeResponse,
    AnalysisResult,
    DetectedIntention,
    BenefitConfirmItem,
    BenefitConfirmRequest,
    BenefitConfirmResponse,
)
from app.schemas.report import (
    CategoryBreakdownItem,
    CategoryBreakdown,
    MonthlyTrendItem,
    AnnualReportRequest,
    AnnualReportResponse,
)

__all__ = [
    # User
    "UserBase",
    "UserCreate",
    "UserResponse",
    # Payment
    "PaymentHistoryBase",
    "PaymentHistoryCreate",
    "PaymentHistoryResponse",
    "CategorySummary",
    "PaymentAnalysisSummary",
    "ChatLogBase",
    "ChatLogCreate",
    "ChatLogResponse",
    # Benefit
    "BenefitOptionBase",
    "BenefitOptionResponse",
    "CardBenefitBase",
    "CardBenefitCreate",
    "CardBenefitResponse",
    "CardBenefitWithDetails",
    "RecommendedBenefit",
    "BenefitComparison",
    "BenefitComparisonSavings",
    "AnalyzeRequest",
    "AnalyzeResponse",
    "AnalysisResult",
    "DetectedIntention",
    "BenefitConfirmItem",
    "BenefitConfirmRequest",
    "BenefitConfirmResponse",
    # Report
    "CategoryBreakdownItem",
    "CategoryBreakdown",
    "MonthlyTrendItem",
    "AnnualReportRequest",
    "AnnualReportResponse",
]
