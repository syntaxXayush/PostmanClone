from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional, List
from app.schemas.base import ORMBaseSchema

class EnvironmentVariableBase(BaseModel):
    key: str = Field(..., min_length=1, max_length=255)
    value: str = Field(default="")
    enabled: bool = Field(default=True)

    @field_validator('key')
    @classmethod
    def check_key(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError('Key cannot be empty')
        return v

class EnvironmentVariableCreate(EnvironmentVariableBase):
    pass

class EnvironmentVariableUpdate(BaseModel):
    key: Optional[str] = Field(default=None, min_length=1, max_length=255)
    value: Optional[str] = Field(default=None)
    enabled: Optional[bool] = Field(default=None)

    @field_validator('key')
    @classmethod
    def check_key(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError('Key cannot be empty')
        return v

class EnvironmentVariableRead(EnvironmentVariableBase, ORMBaseSchema):
    pass

class EnvironmentBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)

    @field_validator('name')
    @classmethod
    def check_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError('Environment name cannot be empty')
        return v

class EnvironmentCreate(EnvironmentBase):
    variables: List[EnvironmentVariableCreate] = Field(default_factory=list)

class EnvironmentUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)

    @field_validator('name')
    @classmethod
    def check_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError('Environment name cannot be empty')
        return v

class EnvironmentRead(EnvironmentBase, ORMBaseSchema):
    variables: List[EnvironmentVariableRead] = Field(default_factory=list)
