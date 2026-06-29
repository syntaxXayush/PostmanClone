from pydantic import BaseModel, Field, ConfigDict
from typing import Any, Optional

class SettingBase(BaseModel):
    key: str = Field(..., min_length=1)
    value: Any = Field(...)

class SettingCreate(SettingBase):
    pass

class SettingUpdate(BaseModel):
    value: Any = Field(...)

class SettingRead(SettingBase):
    model_config = ConfigDict(from_attributes=True)
