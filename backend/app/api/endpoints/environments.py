from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from app.dependencies.database import get_db
from app.dependencies.services import get_environment_service
from app.services.environment import EnvironmentService
from app.services.exceptions import EnvironmentNotFoundError, ServiceError
from app.schemas.environments import EnvironmentCreate, EnvironmentUpdate, EnvironmentRead
from app.schemas.responses import SuccessResponse

router = APIRouter(prefix="/environments", tags=["Environments"])

@router.post("/", response_model=SuccessResponse[EnvironmentRead], status_code=status.HTTP_201_CREATED)
async def create_environment(
    data: EnvironmentCreate,
    db: AsyncSession = Depends(get_db),
    service: EnvironmentService = Depends(get_environment_service)
):
    try:
        env = await service.create_environment(db, data)
        return SuccessResponse(data=env)
    except ServiceError as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=SuccessResponse[List[EnvironmentRead]])
async def get_all_environments(
    skip: int = 0, limit: int = 100,
    db: AsyncSession = Depends(get_db),
    service: EnvironmentService = Depends(get_environment_service)
):
    envs = await service.get_all_environments(db, skip, limit)
    return SuccessResponse(data=envs)

@router.get("/{uuid}", response_model=SuccessResponse[EnvironmentRead])
async def get_environment(
    uuid: str,
    db: AsyncSession = Depends(get_db),
    service: EnvironmentService = Depends(get_environment_service)
):
    try:
        env = await service.get_environment(db, uuid)
        return SuccessResponse(data=env)
    except EnvironmentNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.patch("/{uuid}", response_model=SuccessResponse[EnvironmentRead])
async def update_environment(
    uuid: str, data: EnvironmentUpdate,
    db: AsyncSession = Depends(get_db),
    service: EnvironmentService = Depends(get_environment_service)
):
    try:
        env = await service.update_environment(db, uuid, data)
        return SuccessResponse(data=env)
    except EnvironmentNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ServiceError as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{uuid}", response_model=SuccessResponse[None])
async def delete_environment(
    uuid: str,
    db: AsyncSession = Depends(get_db),
    service: EnvironmentService = Depends(get_environment_service)
):
    try:
        await service.delete_environment(db, uuid)
        return SuccessResponse(data=None)
    except EnvironmentNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ServiceError as e:
        raise HTTPException(status_code=500, detail=str(e))
