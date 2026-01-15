"""Supabase 데이터베이스 서비스"""
from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID

from supabase import create_client, Client

from app.config import get_settings
from app.utils.exceptions import DatabaseError, NotFoundError


class SupabaseService:
    """Supabase CRUD 작업 서비스"""

    def __init__(self):
        settings = get_settings()
        self.client: Client = create_client(
            settings.supabase_url,
            settings.supabase_key,
        )

    # ==================== Users ====================

    async def get_user(self, user_id: UUID) -> dict:
        """사용자 조회"""
        try:
            response = (
                self.client.table("users")
                .select("*")
                .eq("id", str(user_id))
                .single()
                .execute()
            )
            if not response.data:
                raise NotFoundError("User", user_id)
            return response.data
        except Exception as e:
            if isinstance(e, NotFoundError):
                raise
            raise DatabaseError(str(e), "get_user")

    async def create_user(self, email: str, name: str) -> dict:
        """사용자 생성"""
        try:
            response = (
                self.client.table("users")
                .insert({"email": email, "name": name})
                .execute()
            )
            return response.data[0]
        except Exception as e:
            raise DatabaseError(str(e), "create_user")

    async def get_or_create_user(self, email: str, name: str) -> dict:
        """사용자 조회 또는 생성"""
        try:
            response = (
                self.client.table("users")
                .select("*")
                .eq("email", email)
                .single()
                .execute()
            )
            if response.data:
                return response.data
        except Exception:
            pass

        return await self.create_user(email, name)

    # ==================== Payment History ====================

    async def get_payment_history(
        self,
        user_id: UUID,
        months: int = 12,
        limit: Optional[int] = None,
    ) -> list[dict]:
        """사용자의 결제 내역 조회"""
        try:
            start_date = datetime.now() - timedelta(days=months * 30)

            query = (
                self.client.table("payment_history")
                .select("*")
                .eq("user_id", str(user_id))
                .gte("transaction_date", start_date.isoformat())
                .order("transaction_date", desc=True)
            )

            if limit:
                query = query.limit(limit)

            response = query.execute()
            return response.data or []
        except Exception as e:
            raise DatabaseError(str(e), "get_payment_history")

    async def get_payment_summary_by_category(
        self,
        user_id: UUID,
        months: int = 12,
    ) -> list[dict]:
        """카테고리별 결제 요약"""
        payments = await self.get_payment_history(user_id, months)

        category_totals: dict[str, dict] = {}
        total_amount = 0

        for payment in payments:
            category = payment["category"]
            amount = payment["amount"]
            total_amount += amount

            if category not in category_totals:
                category_totals[category] = {"amount": 0, "count": 0}

            category_totals[category]["amount"] += amount
            category_totals[category]["count"] += 1

        result = []
        for category, data in category_totals.items():
            percentage = (data["amount"] / total_amount * 100) if total_amount > 0 else 0
            result.append({
                "category": category,
                "amount": data["amount"],
                "percentage": round(percentage, 1),
                "transaction_count": data["count"],
            })

        return sorted(result, key=lambda x: x["amount"], reverse=True)

    async def create_payment_history(
        self,
        user_id: UUID,
        merchant_name: str,
        category: str,
        amount: int,
        transaction_date: datetime,
        payment_method: str = "카카오페이",
        description: Optional[str] = None,
    ) -> dict:
        """결제 내역 생성"""
        try:
            response = (
                self.client.table("payment_history")
                .insert({
                    "user_id": str(user_id),
                    "merchant_name": merchant_name,
                    "category": category,
                    "amount": amount,
                    "transaction_date": transaction_date.isoformat(),
                    "payment_method": payment_method,
                    "description": description,
                })
                .execute()
            )
            return response.data[0]
        except Exception as e:
            raise DatabaseError(str(e), "create_payment_history")

    # ==================== Chat Logs ====================

    async def get_chat_logs(
        self,
        user_id: UUID,
        chat_room_id: Optional[str] = None,
        limit: int = 100,
    ) -> list[dict]:
        """채팅 로그 조회"""
        try:
            query = (
                self.client.table("chat_logs")
                .select("*")
                .eq("user_id", str(user_id))
                .order("sent_at", desc=True)
                .limit(limit)
            )

            if chat_room_id:
                query = query.eq("chat_room_id", chat_room_id)

            response = query.execute()
            return response.data or []
        except Exception as e:
            raise DatabaseError(str(e), "get_chat_logs")

    async def create_chat_log(
        self,
        user_id: UUID,
        message_content: str,
        sent_at: datetime,
        chat_room_id: Optional[str] = None,
        sender_type: str = "user",
        metadata: Optional[dict] = None,
    ) -> dict:
        """채팅 로그 생성"""
        try:
            response = (
                self.client.table("chat_logs")
                .insert({
                    "user_id": str(user_id),
                    "chat_room_id": chat_room_id,
                    "message_content": message_content,
                    "sender_type": sender_type,
                    "sent_at": sent_at.isoformat(),
                    "metadata": metadata,
                })
                .execute()
            )
            return response.data[0]
        except Exception as e:
            raise DatabaseError(str(e), "create_chat_log")

    # ==================== Benefit Options ====================

    async def get_benefit_options(self, is_active: bool = True) -> list[dict]:
        """혜택 옵션 목록 조회"""
        try:
            response = (
                self.client.table("benefit_options")
                .select("*")
                .eq("is_active", is_active)
                .execute()
            )
            return response.data or []
        except Exception as e:
            raise DatabaseError(str(e), "get_benefit_options")

    async def get_benefit_option(self, option_id: UUID) -> dict:
        """혜택 옵션 단건 조회"""
        try:
            response = (
                self.client.table("benefit_options")
                .select("*")
                .eq("id", str(option_id))
                .single()
                .execute()
            )
            if not response.data:
                raise NotFoundError("BenefitOption", option_id)
            return response.data
        except Exception as e:
            if isinstance(e, NotFoundError):
                raise
            raise DatabaseError(str(e), "get_benefit_option")

    # ==================== Card Benefits ====================

    async def get_user_benefits(
        self,
        user_id: UUID,
        is_active: bool = True,
    ) -> list[dict]:
        """사용자의 활성 혜택 조회"""
        try:
            response = (
                self.client.table("card_benefits")
                .select("*, benefit_options(*)")
                .eq("user_id", str(user_id))
                .eq("is_active", is_active)
                .order("slot_number")
                .execute()
            )
            return response.data or []
        except Exception as e:
            raise DatabaseError(str(e), "get_user_benefits")

    async def update_user_benefits(
        self,
        user_id: UUID,
        benefits: list[dict],
    ) -> list[dict]:
        """사용자 혜택 업데이트 (전체 교체)"""
        try:
            # 기존 혜택 비활성화
            self.client.table("card_benefits").update({
                "is_active": False,
            }).eq("user_id", str(user_id)).eq("is_active", True).execute()

            # 새 혜택 추가
            now = datetime.now().isoformat()
            new_benefits = []

            for benefit in benefits:
                new_benefit = {
                    "user_id": str(user_id),
                    "benefit_option_id": str(benefit["benefit_option_id"]),
                    "custom_discount_rate": benefit.get("custom_discount_rate"),
                    "custom_monthly_limit": benefit.get("custom_monthly_limit"),
                    "slot_number": benefit["slot_number"],
                    "is_active": True,
                    "activated_at": now,
                }
                new_benefits.append(new_benefit)

            if new_benefits:
                response = (
                    self.client.table("card_benefits")
                    .insert(new_benefits)
                    .execute()
                )
                return response.data or []

            return []
        except Exception as e:
            raise DatabaseError(str(e), "update_user_benefits")

    # ==================== Benefit History ====================

    async def create_benefit_history(
        self,
        user_id: UUID,
        action_type: str,
        old_benefits: Optional[list] = None,
        new_benefits: Optional[list] = None,
        recommendation_reason: Optional[str] = None,
    ) -> dict:
        """혜택 변경 이력 생성"""
        try:
            response = (
                self.client.table("benefit_history")
                .insert({
                    "user_id": str(user_id),
                    "action_type": action_type,
                    "old_benefits": old_benefits,
                    "new_benefits": new_benefits,
                    "recommendation_reason": recommendation_reason,
                })
                .execute()
            )
            return response.data[0]
        except Exception as e:
            raise DatabaseError(str(e), "create_benefit_history")

    async def get_benefit_history(
        self,
        user_id: UUID,
        limit: int = 10,
    ) -> list[dict]:
        """혜택 변경 이력 조회"""
        try:
            response = (
                self.client.table("benefit_history")
                .select("*")
                .eq("user_id", str(user_id))
                .order("created_at", desc=True)
                .limit(limit)
                .execute()
            )
            return response.data or []
        except Exception as e:
            raise DatabaseError(str(e), "get_benefit_history")


# 싱글톤 인스턴스
_supabase_service: Optional[SupabaseService] = None


def get_supabase_service() -> SupabaseService:
    """Supabase 서비스 인스턴스 반환"""
    global _supabase_service
    if _supabase_service is None:
        _supabase_service = SupabaseService()
    return _supabase_service
