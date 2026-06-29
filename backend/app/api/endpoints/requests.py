from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.dependencies.database import get_db
from app.dependencies.services import get_request_service
from app.services.request import RequestService
from app.services.exceptions import RequestNotFoundError, CollectionNotFoundError, FolderNotFoundError, ServiceError
from app.schemas.requests import RequestCreate, RequestUpdate, RequestRead
from app.schemas.responses import SuccessResponse

router = APIRouter(prefix="/requests", tags=["Requests"])

@router.post("/", response_model=SuccessResponse[RequestRead], status_code=status.HTTP_201_CREATED)
async def create_request(
    data: RequestCreate,
    db: AsyncSession = Depends(get_db),
    service: RequestService = Depends(get_request_service)
):
    try:
        req = await service.create_request(db, data)
        return SuccessResponse(data=req)
    except (CollectionNotFoundError, FolderNotFoundError) as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ServiceError as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{uuid}", response_model=SuccessResponse[RequestRead])
async def get_request(
    uuid: str,
    db: AsyncSession = Depends(get_db),
    service: RequestService = Depends(get_request_service)
):
    try:
        req = await service.get_request(db, uuid)
        return SuccessResponse(data=req)
    except RequestNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.patch("/{uuid}", response_model=SuccessResponse[RequestRead])
async def update_request(
    uuid: str, data: RequestUpdate,
    db: AsyncSession = Depends(get_db),
    service: RequestService = Depends(get_request_service)
):
    try:
        req = await service.update_request(db, uuid, data)
        return SuccessResponse(data=req)
    except (RequestNotFoundError, FolderNotFoundError) as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ServiceError as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{uuid}", response_model=SuccessResponse[None])
async def delete_request(
    uuid: str,
    db: AsyncSession = Depends(get_db),
    service: RequestService = Depends(get_request_service)
):
    try:
        await service.delete_request(db, uuid)
        return SuccessResponse(data=None)
    except RequestNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ServiceError as e:
        raise HTTPException(status_code=500, detail=str(e))
