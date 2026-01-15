"""FastAPI 애플리케이션 메인 모듈"""
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.api.v1.router import router as v1_router
from app.utils.exceptions import AppException


@asynccontextmanager
async def lifespan(app: FastAPI):
    """애플리케이션 라이프사이클 관리"""
    # 시작 시 실행
    print("🚀 Starting AI Dynamic Custom Card Backend...")
    yield
    # 종료 시 실행
    print("👋 Shutting down...")


# 설정 로드
settings = get_settings()

# FastAPI 앱 생성
app = FastAPI(
    title="AI Dynamic Custom Card API",
    description="사용자의 소비 패턴을 분석하여 맞춤형 카드 혜택을 추천하는 API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 전역 예외 핸들러
@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    """애플리케이션 예외 핸들러"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.message,
            "details": exc.details,
        },
    )


# API 라우터 등록
app.include_router(v1_router, prefix="/api/v1")


# 헬스체크 엔드포인트
@app.get("/health")
async def health_check():
    """헬스체크"""
    return {"status": "healthy", "service": "ai-dynamic-card-backend"}


@app.get("/")
async def root():
    """루트 엔드포인트"""
    return {
        "message": "AI Dynamic Custom Card API",
        "version": "1.0.0",
        "docs": "/docs",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )
