"""커스텀 예외 클래스"""
from typing import Any, Optional


class AppException(Exception):
    """애플리케이션 기본 예외"""

    def __init__(
        self,
        message: str,
        status_code: int = 500,
        details: Optional[dict[str, Any]] = None,
    ):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class NotFoundError(AppException):
    """리소스를 찾을 수 없음"""

    def __init__(self, resource: str, identifier: Any):
        super().__init__(
            message=f"{resource} not found: {identifier}",
            status_code=404,
            details={"resource": resource, "identifier": str(identifier)},
        )


class ValidationError(AppException):
    """유효성 검증 실패"""

    def __init__(self, message: str, field: Optional[str] = None):
        super().__init__(
            message=message,
            status_code=400,
            details={"field": field} if field else {},
        )


class DatabaseError(AppException):
    """데이터베이스 오류"""

    def __init__(self, message: str, operation: Optional[str] = None):
        super().__init__(
            message=f"Database error: {message}",
            status_code=500,
            details={"operation": operation} if operation else {},
        )


class LLMError(AppException):
    """LLM API 오류"""

    def __init__(self, message: str, provider: str = "anthropic"):
        super().__init__(
            message=f"LLM error ({provider}): {message}",
            status_code=502,
            details={"provider": provider},
        )


class ExternalServiceError(AppException):
    """외부 서비스 오류"""

    def __init__(self, service: str, message: str):
        super().__init__(
            message=f"External service error ({service}): {message}",
            status_code=502,
            details={"service": service},
        )
