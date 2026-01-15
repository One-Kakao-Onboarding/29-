"""User 관련 Pydantic 스키마"""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    """사용자 기본 스키마"""

    email: EmailStr
    name: str = Field(..., min_length=1, max_length=100)


class UserCreate(UserBase):
    """사용자 생성 스키마"""

    pass


class UserResponse(UserBase):
    """사용자 응답 스키마"""

    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
