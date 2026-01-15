"""API v1 라우터"""
from fastapi import APIRouter

from app.api.v1.endpoints import analyze, benefits, reports

router = APIRouter()

# 엔드포인트 라우터 등록
router.include_router(analyze.router, tags=["분석 및 추천"])
router.include_router(benefits.router, tags=["혜택 관리"])
router.include_router(reports.router, tags=["리포트"])
