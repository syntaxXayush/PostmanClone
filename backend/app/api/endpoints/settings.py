from fastapi import APIRouter, Depends, HTTPException
from typing import Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.dependencies.database import get_db
from app.dependencies.services import get_settings_service
from app.services.settings import SettingsService
from app.services.exceptions import ServiceError
from app.schemas.settings import SettingRead
from app.schemas.responses import SuccessResponse
from pydantic import BaseModel

router = APIRouter(prefix="/settings", tags=["Settings"])

class SettingUpdateRequest(BaseModel):
    value: Any

@router.get("/{key}", response_model=SuccessResponse[Any])
async def get_setting(
    key: str,
    db: AsyncSession = Depends(get_db),
    service: SettingsService = Depends(get_settings_service)
):
    value = await service.get_setting(db, key)
    return SuccessResponse(data=value)

@router.put("/{key}", response_model=SuccessResponse[SettingRead])
async def set_setting(
    key: str,
    data: SettingUpdateRequest,
    db: AsyncSession = Depends(get_db),
    service: SettingsService = Depends(get_settings_service)
):
    try:
        setting = await service.set_setting(db, key, data.value)
        return SuccessResponse(data=setting)
    except ServiceError as e:
        raise HTTPException(status_code=500, detail=str(e))
