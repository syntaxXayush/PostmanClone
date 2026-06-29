from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, Any
from app.schemas.base import ORMBaseSchema
from app.schemas.requests import HttpMethod

class HistoryBase(BaseModel):
    method: HttpMethod = Field(...)
    url: str = Field(...)
    status_code: int = Field(...)
    response_time_ms: int = Field(...)
    response_size: int = Field(...)
    
    request_headers: Dict[str, Any] = Field(default_factory=dict)
    response_headers: Dict[str, Any] = Field(default_factory=dict)
    response_body: Optional[str] = Field(default=None)
    
    environment_uuid: Optional[str] = Field(default=None)

class HistoryCreate(HistoryBase):
    pass

class HistoryRead(HistoryBase, ORMBaseSchema):
    pass
