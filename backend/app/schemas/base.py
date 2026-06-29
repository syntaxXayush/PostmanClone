from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

class UUIDSchema(BaseModel):
    uuid: str = Field(..., description="Unique identifier for the resource", examples=["123e4567-e89b-12d3-a456-426614174000"])

class TimestampSchema(BaseModel):
    created_at: datetime = Field(..., description="Timestamp of creation")
    updated_at: datetime = Field(..., description="Timestamp of last update")

class ORMBaseSchema(UUIDSchema, TimestampSchema):
    model_config = ConfigDict(from_attributes=True)
