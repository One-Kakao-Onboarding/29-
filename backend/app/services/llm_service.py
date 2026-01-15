"""Claude API를 사용한 LLM 서비스"""
import json
import re
from typing import Optional
from uuid import UUID

import anthropic

from app.config import get_settings
from app.utils.exceptions import LLMError
from app.utils.prompts import SYSTEM_PROMPT, build_analysis_prompt


class LLMService:
    """Claude API 기반 LLM 서비스"""

    def __init__(self):
        settings = get_settings()
        self.client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        self.model = "claude-sonnet-4-20250514"

    def _extract_json(self, text: str) -> dict:
        """응답에서 JSON 추출"""
        # JSON 블록 찾기
        json_match = re.search(r"```json\s*([\s\S]*?)\s*```", text)
        if json_match:
            json_str = json_match.group(1)
        else:
            # JSON 블록이 없으면 전체 텍스트에서 JSON 찾기
            json_match = re.search(r"\{[\s\S]*\}", text)
            if json_match:
                json_str = json_match.group(0)
            else:
                raise LLMError("No JSON found in response")

        try:
            return json.loads(json_str)
        except json.JSONDecodeError as e:
            raise LLMError(f"Invalid JSON: {e}")

    async def analyze_and_recommend(
        self,
        payment_summary: list[dict],
        chat_logs: list[dict],
        current_benefits: list[dict],
        benefit_options: list[dict],
    ) -> dict:
        """결제 데이터와 채팅 로그를 분석하여 혜택 추천"""

        # 데이터를 문자열로 변환
        payment_str = self._format_payment_summary(payment_summary)
        chat_str = self._format_chat_logs(chat_logs)
        current_benefits_str = self._format_current_benefits(current_benefits)
        benefit_options_str = self._format_benefit_options(benefit_options)

        # 프롬프트 생성
        user_prompt = build_analysis_prompt(
            payment_summary=payment_str,
            chat_logs=chat_str,
            current_benefits=current_benefits_str,
            benefit_options=benefit_options_str,
        )

        try:
            message = self.client.messages.create(
                model=self.model,
                max_tokens=4096,
                system=SYSTEM_PROMPT,
                messages=[
                    {"role": "user", "content": user_prompt},
                ],
            )

            response_text = message.content[0].text
            return self._extract_json(response_text)

        except anthropic.APIError as e:
            raise LLMError(f"API error: {e}")
        except Exception as e:
            raise LLMError(str(e))

    def _format_payment_summary(self, payments: list[dict]) -> str:
        """결제 요약 포맷팅"""
        if not payments:
            return "결제 내역이 없습니다."

        total = sum(p.get("amount", 0) for p in payments)

        lines = [f"총 소비액: {total:,}원", "", "카테고리별 소비:"]
        for p in payments[:10]:  # 상위 10개 카테고리
            lines.append(
                f"- {p['category']}: {p['amount']:,}원 ({p['percentage']}%, {p['transaction_count']}건)"
            )

        return "\n".join(lines)

    def _format_chat_logs(self, logs: list[dict]) -> str:
        """채팅 로그 포맷팅"""
        if not logs:
            return "채팅 데이터가 없습니다."

        lines = []
        for log in logs[:50]:  # 최근 50개 메시지
            sender = log.get("sender_type", "user")
            content = log.get("message_content", "")
            lines.append(f"[{sender}] {content}")

        return "\n".join(lines)

    def _format_current_benefits(self, benefits: list[dict]) -> str:
        """현재 혜택 포맷팅"""
        if not benefits:
            return "현재 활성화된 혜택이 없습니다."

        lines = ["현재 활성 혜택:"]
        for b in benefits:
            option = b.get("benefit_options", {})
            lines.append(
                f"- Slot {b['slot_number']}: {option.get('benefit_name', 'Unknown')} "
                f"({option.get('category', 'Unknown')})"
            )

        return "\n".join(lines)

    def _format_benefit_options(self, options: list[dict]) -> str:
        """혜택 옵션 포맷팅"""
        if not options:
            return "사용 가능한 혜택이 없습니다."

        lines = ["사용 가능한 혜택 옵션:"]
        for opt in options:
            lines.append(
                f"- ID: {opt['id']}\n"
                f"  카테고리: {opt['category']}\n"
                f"  혜택명: {opt['benefit_name']}\n"
                f"  타입: {opt['benefit_type']}\n"
                f"  최대 할인율: {opt.get('max_discount_rate', 0)}%\n"
                f"  월 한도: {opt.get('max_monthly_limit', 0):,}원\n"
                f"  설명: {opt.get('description', '')}\n"
            )

        return "\n".join(lines)


# 싱글톤 인스턴스
_llm_service: Optional[LLMService] = None


def get_llm_service() -> LLMService:
    """LLM 서비스 인스턴스 반환"""
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService()
    return _llm_service
