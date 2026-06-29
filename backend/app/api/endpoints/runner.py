from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.dependencies.database import get_db
from app.dependencies.services import get_request_runner_service
from app.services.runner import RequestRunnerService
from app.services.exceptions import RequestExecutionError, EnvironmentNotFoundError, VariableResolutionError, ServiceError
from app.schemas.requests import RequestBase
from app.schemas.history import HistoryRead
from app.schemas.responses import SuccessResponse

router = APIRouter(prefix="/runner", tags=["Runner"])

@router.post("/execute", response_model=SuccessResponse[HistoryRead])
async def execute_request(
    request_data: RequestBase,
    environment_uuid: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    service: RequestRunnerService = Depends(get_request_runner_service)
):
    try:
        history = await service.execute_request(db, request_data, environment_uuid)
        return SuccessResponse(data=history)
    except EnvironmentNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except (VariableResolutionError, RequestExecutionError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    except ServiceError as e:
        raise HTTPException(status_code=500, detail=str(e))
