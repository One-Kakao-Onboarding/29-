"""Payment 관련 Pydantic 스키마"""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class PaymentHistoryBase(BaseModel):
    """결제 내역 기본 스키마"""

    merchant_name: str = Field(..., min_length=1, max_length=200)
    category: str = Field(..., min_length=1, max_length=50)
    amount: int = Field(..., gt=0)
    payment_method: str = Field(default="카카오페이", max_length=50)
    transaction_date: datetime
    description: Optional[str] = None


class PaymentHistoryCreate(PaymentHistoryBase):
    """결제 내역 생성 스키마"""

    user_id: UUID


class PaymentHistoryResponse(PaymentHistoryBase):
    """결제 내역 응답 스키마"""

    id: UUID
    user_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class CategorySummary(BaseModel):
    """카테고리별 소비 요약"""

    category: str
    amount: int
    percentage: float = Field(..., ge=0, le=100)
    transaction_count: int


class PaymentAnalysisSummary(BaseModel):
    """결제 분석 요약"""

    total_spending: int
    total_transactions: int
    top_categories: list[CategorySummary]
    monthly_average: int
    analysis_period_months: int


class ChatLogBase(BaseModel):
    """채팅 로그 기본 스키마"""

    chat_room_id: Optional[str] = None
    message_content: str = Field(..., min_length=1)
    sender_type: str = Field(default="user", max_length=20)
    sent_at: datetime
    metadata: Optional[dict] = None


class ChatLogCreate(ChatLogBase):
    """채팅 로그 생성 스키마"""

    user_id: UUID


class ChatLogResponse(ChatLogBase):
    """채팅 로그 응답 스키마"""

    id: UUID
    user_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True
