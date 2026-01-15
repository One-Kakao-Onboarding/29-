"""분석 및 추천 API 엔드포인트"""
from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, HTTPException

from app.schemas.benefit import (
    AnalyzeRequest,
    AnalyzeResponse,
    AnalysisResult,
    RecommendedBenefit,
    BenefitComparison,
    BenefitComparisonSavings,
    CardBenefitWithDetails,
    BenefitOptionResponse,
)
from app.services.supabase_service import get_supabase_service
from app.services.llm_service import get_llm_service
from app.utils.exceptions import AppException

router = APIRouter()


@router.post("/analyze-and-recommend", response_model=AnalyzeResponse)
async def analyze_and_recommend(request: AnalyzeRequest) -> AnalyzeResponse:
    """
    사용자의 결제 이력과 채팅 로그를 분석하여 맞춤형 혜택을 추천합니다.

    - 과거 소비 패턴 기반 추천 3개
    - 미래 소비 의도 기반 추천 2개
    """
    db = get_supabase_service()
    llm = get_llm_service()

    try:
        # 1. 사용자 확인
        user = await db.get_user(request.user_id)

        # 2. 결제 내역 조회 및 요약
        payment_summary = await db.get_payment_summary_by_category(
            request.user_id,
            request.analysis_period_months,
        )

        # 3. 채팅 로그 조회
        chat_logs = await db.get_chat_logs(
            request.user_id,
            request.chat_room_id,
        )

        # 4. 현재 혜택 조회
        current_benefits = await db.get_user_benefits(request.user_id)

        # 5. 사용 가능한 혜택 옵션 조회
        benefit_options = await db.get_benefit_options()

        # 6. LLM 분석 및 추천
        llm_result = await llm.analyze_and_recommend(
            payment_summary=payment_summary,
            chat_logs=chat_logs,
            current_benefits=current_benefits,
            benefit_options=benefit_options,
        )

        # 7. 응답 구성
        analysis_summary = AnalysisResult(
            total_spending=llm_result.get("analysis_summary", {}).get("total_spending", 0),
            top_categories=llm_result.get("analysis_summary", {}).get("top_categories", []),
            detected_intentions=llm_result.get("analysis_summary", {}).get("detected_intentions", []),
        )

        # 현재 혜택을 응답 형식으로 변환
        current_benefits_response = []
        for b in current_benefits:
            benefit_option = b.get("benefit_options")
            current_benefits_response.append(
                CardBenefitWithDetails(
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
                    benefit_option=BenefitOptionResponse(**benefit_option) if benefit_option else None,
                )
            )

        # 추천 혜택 변환
        recommended_benefits = []
        for rec in llm_result.get("recommended_benefits", []):
            recommended_benefits.append(
                RecommendedBenefit(
                    slot_number=rec["slot_number"],
                    benefit_option_id=rec["benefit_option_id"],
                    category=rec["category"],
                    benefit_name=rec["benefit_name"],
                    benefit_type=rec.get("benefit_type", "discount"),
                    discount_rate=rec.get("discount_rate", 0),
                    monthly_limit=rec.get("monthly_limit", 0),
                    reason=rec["reason"],
                )
            )

        # 예상 절감액 계산
        expected_savings = llm_result.get("expected_savings", {})
        comparison = BenefitComparison(
            expected_monthly_savings=BenefitComparisonSavings(
                current=expected_savings.get("current", 0),
                recommended=expected_savings.get("recommended", 0),
                improvement=expected_savings.get("improvement", 0),
            )
        )

        return AnalyzeResponse(
            user_id=request.user_id,
            analysis_summary=analysis_summary,
            current_benefits=current_benefits_response,
            recommended_benefits=recommended_benefits,
            comparison=comparison,
        )

    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
