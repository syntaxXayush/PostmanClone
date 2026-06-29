from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import AsyncSessionLocal
from app.dependencies.database import get_db
from app.dependencies.services import get_collection_service
from app.services.collection import CollectionService
from app.repositories.exceptions import DuplicateError
from app.services.exceptions import CollectionNotFoundError, ServiceError
from app.schemas.collections import CollectionCreate, CollectionUpdate, CollectionRead, CollectionNestedRead
from app.schemas.responses import SuccessResponse

router = APIRouter(prefix="/collections", tags=["Collections"])

@router.post("/", response_model=SuccessResponse[CollectionRead], status_code=status.HTTP_201_CREATED)
async def create_collection(
    data: CollectionCreate,
    db: AsyncSession = Depends(get_db),
    service: CollectionService = Depends(get_collection_service)
):
    try:
        col = await service.create_collection(db, data)
        return SuccessResponse(data=col)
    except DuplicateError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except ServiceError as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=SuccessResponse[List[CollectionNestedRead]])
async def get_all_collections(
    skip: int = 0, limit: int = 100,
    db: AsyncSession = Depends(get_db),
    service: CollectionService = Depends(get_collection_service)
):
    cols = await service.get_all_collections(db, skip, limit)
    return SuccessResponse(data=cols)

@router.get("/{uuid}", response_model=SuccessResponse[CollectionNestedRead])
async def get_collection(
    uuid: str,
    db: AsyncSession = Depends(get_db),
    service: CollectionService = Depends(get_collection_service)
):
    try:
        col = await service.get_collection(db, uuid)
        return SuccessResponse(data=col)
    except CollectionNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.patch("/{uuid}", response_model=SuccessResponse[CollectionRead])
async def update_collection(
    uuid: str, data: CollectionUpdate,
    db: AsyncSession = Depends(get_db),
    service: CollectionService = Depends(get_collection_service)
):
    try:
        col = await service.update_collection(db, uuid, data)
        return SuccessResponse(data=col)
    except CollectionNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except DuplicateError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except ServiceError as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{uuid}", response_model=SuccessResponse[None])
async def delete_collection(
    uuid: str,
    db: AsyncSession = Depends(get_db),
    service: CollectionService = Depends(get_collection_service)
):
    try:
        await service.delete_collection(db, uuid)
        return SuccessResponse(data=None)
    except CollectionNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ServiceError as e:
        raise HTTPException(status_code=500, detail=str(e))
