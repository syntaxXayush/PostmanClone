from pydantic import BaseModel, Field, field_validator, HttpUrl, ConfigDict
from typing import Optional, List, Dict, Any, Literal
from app.schemas.base import ORMBaseSchema

HttpMethod = Literal['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']

class RequestBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Name of the request")
    method: HttpMethod = Field(default='GET', description="HTTP Method")
    url: str = Field(..., min_length=1, max_length=2048, description="The URL to send the request to")
    
    body_type: str = Field(default="none")
    raw_body: Optional[str] = Field(default=None)
    
    timeout: int = Field(default=30000, ge=1, le=300000, description="Timeout in milliseconds")
    follow_redirects: bool = Field(default=True)
    verify_ssl: bool = Field(default=True)

    headers: List[Dict[str, Any]] = Field(default_factory=list)
    params: List[Dict[str, Any]] = Field(default_factory=list)
    auth: Dict[str, Any] = Field(default_factory=dict)
    form_data: List[Dict[str, Any]] = Field(default_factory=list)
    
    scripts: Optional[str] = Field(default=None)
    tests: Optional[str] = Field(default=None)

    @field_validator('name', 'url')
    @classmethod
    def strip_and_check_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError('Field cannot be empty')
        return v

class RequestCreate(RequestBase):
    collection_uuid: Optional[str] = Field(default=None, description="UUID of parent collection")
    folder_uuid: Optional[str] = Field(default=None, description="UUID of parent folder")

class RequestUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    method: Optional[HttpMethod] = Field(default=None)
    url: Optional[str] = Field(default=None, min_length=1, max_length=2048)
    body_type: Optional[str] = Field(default=None)
    raw_body: Optional[str] = Field(default=None)
    timeout: Optional[int] = Field(default=None, ge=1, le=300000)
    follow_redirects: Optional[bool] = Field(default=None)
    verify_ssl: Optional[bool] = Field(default=None)
    headers: Optional[List[Dict[str, Any]]] = Field(default=None)
    params: Optional[List[Dict[str, Any]]] = Field(default=None)
    auth: Optional[Dict[str, Any]] = Field(default=None)
    form_data: Optional[List[Dict[str, Any]]] = Field(default=None)
    scripts: Optional[str] = Field(default=None)
    tests: Optional[str] = Field(default=None)
    folder_uuid: Optional[str] = Field(default=None)

class RequestRead(RequestBase, ORMBaseSchema):
    pass
