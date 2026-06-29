from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from app.dependencies.database import get_db
from app.dependencies.services import get_history_service
from app.services.history import HistoryService
from app.services.exceptions import ServiceError
from app.schemas.history import HistoryRead
from app.schemas.responses import SuccessResponse

router = APIRouter(prefix="/history", tags=["History"])

@router.get("/", response_model=SuccessResponse[List[HistoryRead]])
async def get_recent_history(
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    service: HistoryService = Depends(get_history_service)
):
    history = await service.get_recent_history(db, limit)
    return SuccessResponse(data=history)

@router.delete("/", response_model=SuccessResponse[None])
async def clear_history(
    db: AsyncSession = Depends(get_db),
    service: HistoryService = Depends(get_history_service)
):
    try:
        await service.clear_history(db)
        return SuccessResponse(data=None)
    except ServiceError as e:
        raise HTTPException(status_code=500, detail=str(e))
