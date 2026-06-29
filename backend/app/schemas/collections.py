from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional, List
from app.schemas.base import ORMBaseSchema
from app.schemas.folders import FolderRead
from app.schemas.requests import RequestRead

class CollectionBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Name of the collection")
    expanded: bool = Field(default=False)

    @field_validator('name')
    @classmethod
    def strip_and_check_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError('Field cannot be empty')
        return v

class CollectionCreate(CollectionBase):
    pass

class CollectionUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    expanded: Optional[bool] = Field(default=None)

    @field_validator('name')
    @classmethod
    def strip_and_check_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError('Field cannot be empty')
        return v

class CollectionRead(CollectionBase, ORMBaseSchema):
    pass

class CollectionNestedRead(CollectionRead):
    folders: List[FolderRead] = Field(default_factory=list)
    requests: List[RequestRead] = Field(default_factory=list)
