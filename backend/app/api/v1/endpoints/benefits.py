"""혜택 관련 API 엔드포인트"""
from datetime import datetime, timedelta
from uuid import UUID

from fastapi import APIRouter, HTTPException

from app.schemas.benefit import (
    BenefitConfirmRequest,
    BenefitConfirmResponse,
    CardBenefitResponse,
    BenefitOptionResponse,
)
from app.services.supabase_service import get_supabase_service
from app.utils.exceptions import AppException

router = APIRouter()


@router.post("/benefits/confirm", response_model=BenefitConfirmResponse)
async def confirm_benefits(request: BenefitConfirmRequest) -> BenefitConfirmResponse:
    """
    사용자가 선택한 혜택을 확정합니다.

    - 기존 혜택은 비활성화됩니다.
    - 새로운 혜택이 활성화됩니다.
    - 변경 이력이 기록됩니다.
    """
    db = get_supabase_service()

    try:
        # 1. 사용자 확인
        user = await db.get_user(request.user_id)

        # 2. 기존 혜택 조회 (이력용)
        old_benefits = await db.get_user_benefits(request.user_id)

        # 3. 혜택 옵션 유효성 검증
        benefit_options = await db.get_benefit_options()
        valid_option_ids = {opt["id"] for opt in benefit_options}

        for benefit in request.benefits:
            if str(benefit.benefit_option_id) not in valid_option_ids:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid benefit_option_id: {benefit.benefit_option_id}",
                )

        # 4. 새 혜택 저장
        benefits_data = [
            {
                "benefit_option_id": str(b.benefit_option_id),
                "custom_discount_rate": b.custom_discount_rate,
                "custom_monthly_limit": b.custom_monthly_limit,
                "slot_number": b.slot_number,
            }
            for b in request.benefits
        ]

        new_benefits = await db.update_user_benefits(request.user_id, benefits_data)

        # 5. 변경 이력 저장
        await db.create_benefit_history(
            user_id=request.user_id,
            action_type="confirmed",
            old_benefits=[
                {
                    "slot_number": b["slot_number"],
                    "benefit_option_id": b["benefit_option_id"],
                }
                for b in old_benefits
            ],
            new_benefits=[
                {
                    "slot_number": b["slot_number"],
                    "benefit_option_id": b["benefit_option_id"],
                }
                for b in new_benefits
            ],
            recommendation_reason="User confirmed benefits",
        )

        # 6. 응답 구성
        confirmed_benefits = []
        for b in new_benefits:
            confirmed_benefits.append(
                CardBenefitResponse(
                    id=b["id"],
                    user_id=b["user_id"],
                    benefit_option_id=b["benefit_option_id"],
                    custom_discount_rate=b.get("custom_discount_rate"),
                    custom_monthly_limit=b.get("custom_monthly_limit"),
                    slot_number=b["slot_number"],
                    is_active=b["is_active"],
                    activated_at=b["activated_at"],
                    expires_at=b.get("expires_at"),
                    created_at=b["created_at"],
                )
            )

        # 다음 날 00:00부터 적용
        effective_from = datetime.now().replace(
            hour=0, minute=0, second=0, microsecond=0
        ) + timedelta(days=1)

        return BenefitConfirmResponse(
            success=True,
            confirmed_benefits=confirmed_benefits,
            effective_from=effective_from,
        )

    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/benefits/{user_id}")
async def get_user_benefits(user_id: UUID) -> list[dict]:
    """
    사용자의 현재 활성 혜택을 조회합니다.
    """
    db = get_supabase_service()

    try:
        benefits = await db.get_user_benefits(user_id)
        return benefits
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/benefit-options")
async def get_benefit_options() -> list[BenefitOptionResponse]:
    """
    사용 가능한 모든 혜택 옵션을 조회합니다.
    """
    db = get_supabase_service()

    try:
        options = await db.get_benefit_options()
        return [BenefitOptionResponse(**opt) for opt in options]
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
