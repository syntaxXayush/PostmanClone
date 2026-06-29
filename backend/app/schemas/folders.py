from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional
from app.schemas.base import ORMBaseSchema

class FolderBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Name of the folder", examples=["Authentication"])
    expanded: bool = Field(default=False, description="UI state indicating if folder is expanded")

    @field_validator('name')
    @classmethod
    def name_must_not_be_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError('Folder name cannot be empty or just whitespace')
        return v

class FolderCreate(FolderBase):
    collection_uuid: str = Field(..., description="UUID of the parent collection")

class FolderUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    expanded: Optional[bool] = Field(default=None)

    @field_validator('name')
    @classmethod
    def name_must_not_be_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError('Folder name cannot be empty')
        return v

class FolderRead(FolderBase, ORMBaseSchema):
    pass
