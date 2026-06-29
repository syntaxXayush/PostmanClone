from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.dependencies.database import get_db
from app.dependencies.services import get_folder_service
from app.services.folder import FolderService
from app.services.exceptions import FolderNotFoundError, CollectionNotFoundError, ServiceError
from app.schemas.folders import FolderCreate, FolderUpdate, FolderRead
from app.schemas.responses import SuccessResponse

router = APIRouter(prefix="/folders", tags=["Folders"])

@router.post("/", response_model=SuccessResponse[FolderRead], status_code=status.HTTP_201_CREATED)
async def create_folder(
    data: FolderCreate,
    db: AsyncSession = Depends(get_db),
    service: FolderService = Depends(get_folder_service)
):
    try:
        folder = await service.create_folder(db, data)
        return SuccessResponse(data=folder)
    except CollectionNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ServiceError as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{uuid}", response_model=SuccessResponse[FolderRead])
async def update_folder(
    uuid: str, data: FolderUpdate,
    db: AsyncSession = Depends(get_db),
    service: FolderService = Depends(get_folder_service)
):
    try:
        folder = await service.update_folder(db, uuid, data)
        return SuccessResponse(data=folder)
    except FolderNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ServiceError as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{uuid}", response_model=SuccessResponse[None])
async def delete_folder(
    uuid: str,
    db: AsyncSession = Depends(get_db),
    service: FolderService = Depends(get_folder_service)
):
    try:
        await service.delete_folder(db, uuid)
        return SuccessResponse(data=None)
    except FolderNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ServiceError as e:
        raise HTTPException(status_code=500, detail=str(e))
